import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const COINBASE_API_KEY = process.env.COINBASE_COMMERCE_API_KEY;
const COINBASE_API_URL = "https://api.commerce.coinbase.com";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!COINBASE_API_KEY) {
      return NextResponse.json(
        { error: "Coinbase Commerce not configured" },
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
    const lineItems = [];

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

      lineItems.push(`${item.quantity}x ${product.name}`);
    }

    // Create order in database first
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        status: "PENDING",
        total: total,
        shippingAddress: JSON.stringify(shipping),
        paymentProvider: "coinbase",
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

    // Create Coinbase Commerce charge
    const chargeResponse = await fetch(`${COINBASE_API_URL}/charges`, {
      method: "POST",
      headers: {
        "X-CC-Api-Key": COINBASE_API_KEY,
        "X-CC-Version": "2018-03-22",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Collector Card Giveaway Order",
        description: lineItems.join(", "),
        local_price: {
          amount: total.toFixed(2),
          currency: "USD",
        },
        pricing_type: "fixed_price",
        metadata: {
          orderId: order.id,
          userId: session.user.id,
        },
        redirect_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/checkout/success?provider=coinbase`,
        cancel_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/checkout?cancelled=true`,
      }),
    });

    const chargeData = await chargeResponse.json();

    if (!chargeResponse.ok) {
      console.error("Coinbase error:", chargeData);
      // Delete the pending order
      await prisma.order.delete({ where: { id: order.id } });
      return NextResponse.json(
        { error: "Failed to create crypto payment" },
        { status: 500 }
      );
    }

    // Update order with payment ID
    await prisma.order.update({
      where: { id: order.id },
      data: { paymentId: chargeData.data.id },
    });

    return NextResponse.json({
      orderId: order.id,
      chargeId: chargeData.data.id,
      checkoutUrl: chargeData.data.hosted_url,
    });
  } catch (error) {
    console.error("Crypto checkout error:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}

