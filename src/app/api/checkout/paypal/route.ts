import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;

// Use PAYPAL_MODE env var to switch between sandbox and live
// Default to sandbox for safety
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_API_URL = PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com";

async function getPayPalAccessToken(): Promise<string> {
  const credentials = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();

  if (!data.access_token) {
    console.error("PayPal auth failed:", data);
    throw new Error("Failed to get PayPal access token");
  }

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

    const { items } = await request.json();

    // Note: Shipping address will be collected by PayPal and validated in confirm endpoint

    // Get user subscription tier for discount
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true },
    });

    const subscriptionTier = user?.subscriptionTier;
    let discountPercent = 0;
    if (subscriptionTier === "BASIC" || subscriptionTier === "PLUS") {
      discountPercent = 5;
    } else if (subscriptionTier === "PREMIUM") {
      discountPercent = 7;
    }

    // Validate items and calculate total
    const productIds = items.map((item: { id: string }) => item.id);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });

    let subtotal = 0;
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

      let itemPrice = Number(product.price);
      
      // Apply VIP discount
      if (discountPercent > 0) {
        itemPrice = itemPrice * (1 - discountPercent / 100);
      }

      const itemTotal = itemPrice * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        name: product.name,
        unit_amount: {
          currency_code: "USD",
          value: itemPrice.toFixed(2),
        },
        quantity: item.quantity.toString(),
      });
    }

    const total = subtotal;

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
            // Shipping address will be collected by PayPal
          },
        ],
        application_context: {
          brand_name: "Collector Card Giveaway",
          return_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/checkout/success?provider=paypal`,
          cancel_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/checkout?cancelled=true`,
          user_action: "PAY_NOW",
          shipping_preference: "GET_FROM_FILE", // Let PayPal use customer's saved addresses
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

    // Calculate discount amount
    const originalSubtotal = products.reduce((sum, product) => {
      const item = items.find((i: { id: string }) => i.id === product.id);
      return sum + (Number(product.price) * (item?.quantity || 0));
    }, 0);
    const discountAmount = originalSubtotal - subtotal;

    // Store pending order in database (shipping address will be added when PayPal confirms)
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        subtotal: originalSubtotal,
        total: total,
        shippingAddress: null, // Will be populated from PayPal on confirmation
        paymentProvider: "paypal",
        paymentId: orderData.id,
        vipDiscountPercent: discountPercent > 0 ? discountPercent : null,
        vipDiscountAmount: discountAmount > 0 ? discountAmount : null,
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
