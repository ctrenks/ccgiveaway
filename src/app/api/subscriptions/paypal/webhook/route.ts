import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TIER_CREDITS: Record<string, number> = {
  BASIC: 100,
  PLUS: 200,
  PREMIUM: 340,
};

// Verify webhook signature (recommended for production)
async function verifyWebhookSignature(
  request: NextRequest,
  body: string
): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  
  if (!webhookId) {
    console.warn("PAYPAL_WEBHOOK_ID not set - skipping signature verification");
    return true; // Skip verification in development
  }

  const paypalMode = process.env.PAYPAL_MODE || "sandbox";
  const baseUrl = paypalMode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  // Get access token
  const authResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  const authData = await authResponse.json();

  if (!authData.access_token) {
    console.error("Failed to get PayPal access token for webhook verification");
    return false;
  }

  // Verify signature
  const verifyResponse = await fetch(
    `${baseUrl}/v1/notifications/verify-webhook-signature`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authData.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        auth_algo: request.headers.get("paypal-auth-algo"),
        cert_url: request.headers.get("paypal-cert-url"),
        transmission_id: request.headers.get("paypal-transmission-id"),
        transmission_sig: request.headers.get("paypal-transmission-sig"),
        transmission_time: request.headers.get("paypal-transmission-time"),
        webhook_id: webhookId,
        webhook_event: JSON.parse(body),
      }),
    }
  );

  const verifyData = await verifyResponse.json();
  return verifyData.verification_status === "SUCCESS";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    
    // Verify webhook signature in production
    const isValid = await verifyWebhookSignature(request, body);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const eventType = event.event_type;
    const resource = event.resource;

    console.log(`PayPal webhook received: ${eventType}`, resource?.id);

    switch (eventType) {
      // Subscription activated (first payment successful)
      case "BILLING.SUBSCRIPTION.ACTIVATED": {
        const subscriptionId = resource.id;
        
        // Find subscription by PayPal ID
        const subscription = await prisma.subscription.findFirst({
          where: { paypalSubscriptionId: subscriptionId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "ACTIVE" },
          });

          await prisma.user.update({
            where: { id: subscription.userId },
            data: { subscriptionTier: subscription.tier },
          });
        }
        break;
      }

      // Payment successful (monthly renewal)
      case "PAYMENT.SALE.COMPLETED": {
        const subscriptionId = resource.billing_agreement_id;
        
        if (!subscriptionId) break;

        const subscription = await prisma.subscription.findFirst({
          where: { paypalSubscriptionId: subscriptionId },
          include: { user: true },
        });

        if (subscription && subscription.status === "ACTIVE") {
          const now = new Date();
          const endDate = new Date(now);
          endDate.setMonth(endDate.getMonth() + 1);

          // Check if we already granted credits this month
          const lastGrant = subscription.user.lastCreditsGranted;
          const shouldGrantCredits = !lastGrant || 
            (now.getTime() - lastGrant.getTime()) > 25 * 24 * 60 * 60 * 1000; // 25 days

          if (shouldGrantCredits) {
            // Update subscription period and grant credits
            await prisma.subscription.update({
              where: { id: subscription.id },
              data: {
                currentPeriodStart: now,
                currentPeriodEnd: endDate,
              },
            });

            await prisma.user.update({
              where: { id: subscription.userId },
              data: {
                subscriptionEnd: endDate,
                lastCreditsGranted: now,
                freeShippingUsedAt: null, // Reset free shipping for new month
                giveawayCredits: {
                  increment: TIER_CREDITS[subscription.tier],
                },
              },
            });

            console.log(
              `Granted ${TIER_CREDITS[subscription.tier]} credits to user ${subscription.userId}`
            );
          }
        }
        break;
      }

      // Subscription cancelled
      case "BILLING.SUBSCRIPTION.CANCELLED": {
        const subscriptionId = resource.id;
        
        const subscription = await prisma.subscription.findFirst({
          where: { paypalSubscriptionId: subscriptionId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "CANCELLED" },
          });

          // Keep tier until end of period, then remove
          // The tier will be removed when the period ends
          console.log(`Subscription ${subscriptionId} cancelled`);
        }
        break;
      }

      // Subscription suspended (payment failed)
      case "BILLING.SUBSCRIPTION.SUSPENDED": {
        const subscriptionId = resource.id;
        
        const subscription = await prisma.subscription.findFirst({
          where: { paypalSubscriptionId: subscriptionId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "PAUSED" },
          });

          // Remove tier immediately on suspension
          await prisma.user.update({
            where: { id: subscription.userId },
            data: { subscriptionTier: null },
          });

          console.log(`Subscription ${subscriptionId} suspended`);
        }
        break;
      }

      // Subscription reactivated
      case "BILLING.SUBSCRIPTION.RE-ACTIVATED": {
        const subscriptionId = resource.id;
        
        const subscription = await prisma.subscription.findFirst({
          where: { paypalSubscriptionId: subscriptionId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "ACTIVE" },
          });

          await prisma.user.update({
            where: { id: subscription.userId },
            data: { subscriptionTier: subscription.tier },
          });

          console.log(`Subscription ${subscriptionId} reactivated`);
        }
        break;
      }

      // Subscription expired
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        const subscriptionId = resource.id;
        
        const subscription = await prisma.subscription.findFirst({
          where: { paypalSubscriptionId: subscriptionId },
        });

        if (subscription) {
          await prisma.subscription.update({
            where: { id: subscription.id },
            data: { status: "EXPIRED" },
          });

          await prisma.user.update({
            where: { id: subscription.userId },
            data: { 
              subscriptionTier: null,
              subscriptionEnd: null,
            },
          });

          console.log(`Subscription ${subscriptionId} expired`);
        }
        break;
      }

      default:
        console.log(`Unhandled webhook event: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}

