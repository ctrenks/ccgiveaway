import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";
import { getCreditsForTier } from "@/lib/subscriptions";
import { SubscriptionTier } from "@prisma/client";

export async function GET() {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const subscriptions = await prisma.subscription.findMany({
    include: {
      user: {
        select: {
          id: true,
          email: true,
          displayName: true,
          giveawayCredits: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ subscriptions });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { userId, tier, paymentMethod, cryptoNote } = body;

  if (!userId || !tier) {
    return NextResponse.json(
      { error: "User ID and tier are required" },
      { status: 400 }
    );
  }

  // Get tier price
  const prices: Record<string, number> = {
    BASIC: 20,
    PLUS: 35,
    PREMIUM: 50,
  };

  const price = prices[tier];
  if (!price) {
    return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
  }

  // Calculate period dates
  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  // Create or update subscription
  const subscription = await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier: tier as SubscriptionTier,
      status: "ACTIVE",
      paymentMethod: paymentMethod || "crypto",
      amount: price,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cryptoNote,
    },
    update: {
      tier: tier as SubscriptionTier,
      status: "ACTIVE",
      paymentMethod: paymentMethod || "crypto",
      amount: price,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      cryptoNote,
    },
  });

  // Update user subscription fields
  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: tier as SubscriptionTier,
      subscriptionStart: now,
      subscriptionEnd: periodEnd,
      lastCreditsGranted: now,
      freeShippingUsedAt: null, // Reset free shipping for new period
    },
  });

  // Grant initial credits
  const credits = getCreditsForTier(tier as SubscriptionTier);
  if (credits > 0) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        giveawayCredits: { increment: credits },
      },
    });

    // Log the credit addition
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { giveawayCredits: true },
    });

    await prisma.creditLog.create({
      data: {
        userId,
        amount: credits,
        reason: `Subscription activated: ${tier} tier`,
        adminId: session.user.id,
        adminEmail: session.user.email,
        balanceBefore: (user?.giveawayCredits || 0) - credits,
        balanceAfter: user?.giveawayCredits || credits,
      },
    });
  }

  return NextResponse.json({ subscription });
}

