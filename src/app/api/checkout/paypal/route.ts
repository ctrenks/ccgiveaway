import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_URL = process.env.NODE_ENV === "production"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      console.error("PayPal credentials missing:", {
        hasClientId: !!PAYPAL_CLIENT_ID,
        hasSecret: !!PAYPAL_CLIENT_SECRET
      });
      return NextResponse.json(
        { error: "PayPal not configured. Please add PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET to environment variables." },
        { status: 500 }
      );
    }

    const { items, shipping } = await request.json();

    // Validate items and calculate total
    const productIds = items.map((item: { id: string }) => item.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.id);
      if (!product) {
        return NextResponse.json(
          { error: `Product not found: ${item.id}` },
          { status: 400 }
        );
      }
      if (item.quantity > product.quantity) {
        return NextResponse.json(
          { error: `Not enough stock for ${product.name}` },
          { status: 400 }
        );
      }

      const itemTotal = Number(product.price) * item.quantity;
      total += itemTotal;

      orderItems.push({
        name: product.name,
        unit_amount: {
          currency_code: "USD",
          value: Number(product.price).toFixed(2),
        },
        quantity: item.quantity.toString(),
      });
    }

    // Create PayPal order
    const accessToken = await getPayPalAccessToken();

    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: total.toFixed(2),
              breakdown: {
                item_total: {
                  currency_code: "USD",
                  value: total.toFixed(2),
                },
              },
            },
            items: orderItems,
            shipping: {
              name: {
                full_name: shipping.name,
              },
              address: {
                address_line_1: shipping.address,
                admin_area_2: shipping.city,
                admin_area_1: shipping.state,
                postal_code: shipping.zip,
                country_code: shipping.country,
              },
            },
          },
        ],
        application_context: {
          brand_name: "Collector Card Giveaway",
          return_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/checkout/success?provider=paypal`,
          cancel_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/checkout?cancelled=true`,
          user_action: "PAY_NOW",
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("PayPal API error:", JSON.stringify(orderData, null, 2));
      const errorMessage = orderData?.details?.[0]?.description ||
                          orderData?.message ||
                          "Failed to create PayPal order";
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // Store pending order in database
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        total: total,
        shippingAddress: JSON.stringify(shipping),
        paymentProvider: "paypal",
        paymentId: orderData.id,
        items: {
          create: items.map((item: { id: string; quantity: number }) => {
            const product = products.find((p) => p.id === item.id)!;
            return {
              productId: item.id,
              quantity: item.quantity,
              price: Number(product.price),
            };
          }),
        },
      },
    });

    // Find approval URL
    const approvalUrl = orderData.links?.find(
      (link: { rel: string }) => link.rel === "approve"
    )?.href;

    return NextResponse.json({
      orderId: order.id,
      paypalOrderId: orderData.id,
      approvalUrl,
    });
  } catch (error) {
    console.error("PayPal checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}
