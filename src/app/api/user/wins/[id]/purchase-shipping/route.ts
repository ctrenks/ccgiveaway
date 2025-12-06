import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_API_URL =
  PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const SHIPPING_COST = 5.0;

async function getPayPalAccessToken(): Promise<string> {
  const credentials = Buffer.from(
    `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify the win belongs to this user and hasn't been shipped
  const win = await prisma.giveawayWinner.findFirst({
    where: {
      id,
      userId: session.user.id,
      claimed: false,
    },
    include: {
      giveaway: {
        select: {
          title: true,
        },
      },
    },
  });

  if (!win) {
    return NextResponse.json(
      { error: "Win not found or already shipped" },
      { status: 404 }
    );
  }

  try {
    // Create PayPal order for shipping
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
            description: `Shipping for ${win.giveaway.title} - Slot ${win.slot}`,
            amount: {
              currency_code: "USD",
              value: SHIPPING_COST.toFixed(2),
            },
          },
        ],
        application_context: {
          brand_name: "Collector Card Giveaway",
          return_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/profile?shipping=success`,
          cancel_url: `${process.env.NEXTAUTH_URL || process.env.AUTH_URL}/profile/wins/${id}/shipping?cancelled=true`,
          user_action: "PAY_NOW",
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("PayPal API error:", orderData);
      return NextResponse.json(
        { error: "Failed to create payment" },
        { status: 500 }
      );
    }

    // Store the payment ID with the win for confirmation later
    await prisma.giveawayWinner.update({
      where: { id: win.id },
      data: {
        // We'll add a paymentId field or use notes for now
        // For now, admin will manually confirm shipping was paid
      },
    });

    const approvalUrl = orderData.links?.find(
      (link: { rel: string }) => link.rel === "approve"
    )?.href;

    return NextResponse.json({
      paypalOrderId: orderData.id,
      approvalUrl,
    });
  } catch (error) {
    console.error("Shipping payment error:", error);
    return NextResponse.json(
      { error: "Failed to process payment" },
      { status: 500 }
    );
  }
}

