import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { id: giveawayId } = await params;

    // Check if giveaway exists and is active
    const giveaway = await prisma.giveaway.findUnique({
      where: { id: giveawayId },
      select: { status: true, isTest: true },
    });

    if (!giveaway) {
      return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
    }

    if (giveaway.status !== "OPEN" && giveaway.status !== "FILLING") {
      return NextResponse.json(
        { error: "This giveaway is no longer active" },
        { status: 400 }
      );
    }

    // Check if user has already claimed credits for this giveaway
    const existingClaim = await prisma.giveawayCreditClaim.findUnique({
      where: {
        userId_giveawayId: {
          userId: session.user.id,
          giveawayId,
        },
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        { error: "You have already claimed free credits for this giveaway" },
        { status: 400 }
      );
    }

    // Grant 10 free credits and create claim record
    const result = await prisma.$transaction([
      // Add credits to user
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          giveawayCredits: { increment: 10 },
        },
      }),
      // Create claim record
      prisma.giveawayCreditClaim.create({
        data: {
          userId: session.user.id,
          giveawayId,
          creditsClaimed: 10,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      creditsGranted: 10,
      newBalance: result[0].giveawayCredits,
    });
  } catch (error) {
    console.error("Error claiming credits:", error);
    return NextResponse.json(
      { error: "Failed to claim credits" },
      { status: 500 }
    );
  }
}

