import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_MODE = process.env.PAYPAL_MODE || "sandbox";
const PAYPAL_API_URL = PAYPAL_MODE === "live"
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

    const { provider, token } = await request.json();

    if (provider === "paypal" && token) {
      // Capture the PayPal payment
      const accessToken = await getPayPalAccessToken();

      const captureResponse = await fetch(
        `${PAYPAL_API_URL}/v2/checkout/orders/${token}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const captureData = await captureResponse.json();

      if (captureData.status === "COMPLETED") {
        // Find and update the order
        const order = await prisma.order.findFirst({
          where: {
            paymentId: token,
            userId: session.user.id,
            status: "PENDING",
          },
          include: { items: true },
        });

        if (order) {
          // Update order status
          await prisma.order.update({
            where: { id: order.id },
            data: { status: "PAID" },
          });

          // Reduce product quantities
          for (const item of order.items) {
            await prisma.product.update({
              where: { id: item.productId },
              data: { quantity: { decrement: item.quantity } },
            });
          }

          // Add giveaway credits
          const settings = await prisma.settings.findUnique({
            where: { id: "default" },
          });
          const creditsPerDollar = settings?.giveawayCreditsPerDollar
            ? Number(settings.giveawayCreditsPerDollar)
            : 0.1;

          const creditsEarned = Math.floor(Number(order.total) * creditsPerDollar);

          if (creditsEarned > 0) {
            await prisma.user.update({
              where: { id: session.user.id },
              data: { giveawayCredits: { increment: creditsEarned } },
            });

            await prisma.order.update({
              where: { id: order.id },
              data: { creditsEarned },
            });
          }

          return NextResponse.json({ success: true, orderId: order.id });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Confirm payment error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
