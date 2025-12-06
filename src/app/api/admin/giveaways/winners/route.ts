import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export async function GET() {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.MODERATOR) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const winners = await prisma.giveawayWinner.findMany({
    where: {
      claimed: false,
    },
    include: {
      giveaway: {
        select: {
          title: true,
          image: true,
        },
      },
      user: {
        select: {
          name: true,
          displayName: true,
          email: true,
          shippingName: true,
          shippingAddress: true,
          shippingCity: true,
          shippingState: true,
          shippingZip: true,
          shippingCountry: true,
          subscriptionTier: true,
          freeShippingUsedAt: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ winners });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.MODERATOR) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { winnerId, trackingNumber, usedVipFreeShipping } = await request.json();

  if (!winnerId) {
    return NextResponse.json({ error: "Winner ID required" }, { status: 400 });
  }

  // Update winner
  const winner = await prisma.giveawayWinner.update({
    where: { id: winnerId },
    data: {
      claimed: true,
      shippedAt: new Date(),
      trackingNumber: trackingNumber || null,
      usedVipFreeShipping: usedVipFreeShipping || false,
    },
  });

  // If VIP free shipping was used, update user's freeShippingUsedAt
  if (usedVipFreeShipping) {
    await prisma.user.update({
      where: { id: winner.userId },
      data: {
        freeShippingUsedAt: new Date(),
      },
    });
  }

  return NextResponse.json({ success: true, winner });
}

