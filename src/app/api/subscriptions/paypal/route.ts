import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PayPal Plan IDs - set these in your environment variables
const PLAN_IDS: Record<string, string> = {
  BASIC: process.env.PAYPAL_PLAN_BASIC || "",
  PLUS: process.env.PAYPAL_PLAN_PLUS || "",
  PREMIUM: process.env.PAYPAL_PLAN_PREMIUM || "",
};

const TIER_CREDITS: Record<string, number> = {
  BASIC: 100,
  PLUS: 200,
  PREMIUM: 340,
};

const TIER_PRICES: Record<string, number> = {
  BASIC: 20,
  PLUS: 35,
  PREMIUM: 50,
};

// GET - Get plan ID for a tier
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const tier = searchParams.get("tier");

  if (!tier || !PLAN_IDS[tier]) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  const planId = PLAN_IDS[tier];
  
  if (!planId) {
    return NextResponse.json(
      { error: "PayPal plan not configured for this tier" },
      { status: 500 }
    );
  }

  return NextResponse.json({ planId });
}

// POST - Activate subscription after PayPal approval
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscriptionId, tier, orderId } = body;

    if (!subscriptionId || !tier) {
      return NextResponse.json(
        { error: "Subscription ID and tier are required" },
        { status: 400 }
      );
    }

    // Verify the subscription with PayPal
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
      console.error("Failed to get PayPal access token:", authData);
      return NextResponse.json(
        { error: "Failed to verify subscription" },
        { status: 500 }
      );
    }

    // Verify subscription
    const subResponse = await fetch(
      `${baseUrl}/v1/billing/subscriptions/${subscriptionId}`,
      {
        headers: {
          Authorization: `Bearer ${authData.access_token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const subData = await subResponse.json();

    if (subData.status !== "ACTIVE" && subData.status !== "APPROVED") {
      console.error("Subscription not active:", subData);
      return NextResponse.json(
        { error: "Subscription is not active" },
        { status: 400 }
      );
    }

    // Calculate subscription period
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + 1);

    // Create or update subscription in database
    const subscription = await prisma.subscription.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        tier: tier as "BASIC" | "PLUS" | "PREMIUM",
        status: "ACTIVE",
        paypalSubscriptionId: subscriptionId,
        paymentMethod: "paypal",
        amount: TIER_PRICES[tier],
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
      },
      update: {
        tier: tier as "BASIC" | "PLUS" | "PREMIUM",
        status: "ACTIVE",
        paypalSubscriptionId: subscriptionId,
        paymentMethod: "paypal",
        amount: TIER_PRICES[tier],
        currentPeriodStart: now,
        currentPeriodEnd: endDate,
      },
    });

    // Grant initial credits
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionTier: tier as "BASIC" | "PLUS" | "PREMIUM",
        subscriptionStart: now,
        subscriptionEnd: endDate,
        lastCreditsGranted: now,
        giveawayCredits: {
          increment: TIER_CREDITS[tier],
        },
      },
    });

    return NextResponse.json({
      success: true,
      subscription,
      creditsGranted: TIER_CREDITS[tier],
    });
  } catch (error) {
    console.error("Error activating subscription:", error);
    return NextResponse.json(
      { error: "Failed to activate subscription" },
      { status: 500 }
    );
  }
}

