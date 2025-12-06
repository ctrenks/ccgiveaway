import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";
import { createGiveawayMultiWinNotification } from "@/lib/notifications";

// Calculate distance from pick to Pick 3 result
function calculateDistance(pick: string, result: string): number {
  const pickNum = parseInt(pick);
  const resultNum = parseInt(result);
  return Math.abs(pickNum - resultNum);
}

// Determine if pick is lower than result (wins ties)
function isLower(pick: string, result: string): boolean {
  return parseInt(pick) < parseInt(result);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { pick3Result } = body;

  // Validate Pick 3 result
  if (!pick3Result || !/^[0-9]{3}$/.test(pick3Result)) {
    return NextResponse.json(
      { error: "Pick 3 result must be a 3-digit number (000-999)" },
      { status: 400 }
    );
  }

  // Get giveaway
  const giveaway = await prisma.giveaway.findUnique({
    where: { id },
  });

  if (!giveaway) {
    return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  }

  if (giveaway.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Giveaway already completed" },
      { status: 400 }
    );
  }

  // Get all picks grouped by slot
  const allPicks = await prisma.giveawayPick.findMany({
    where: { giveawayId: id },
    orderBy: { slot: "asc" },
  });

  // Group picks by slot
  const picksBySlot: Record<number, Array<{ userId: string; pickNumber: string }>> = {};
  allPicks.forEach((pick) => {
    if (!picksBySlot[pick.slot]) {
      picksBySlot[pick.slot] = [];
    }
    picksBySlot[pick.slot].push({
      userId: pick.userId,
      pickNumber: pick.pickNumber,
    });
  });

  // Determine winner for each slot
  const winners: Array<{
    giveawayId: string;
    userId: string;
    slot: number;
    pickNumber: string;
    distance: number;
  }> = [];

  // Helper function to find winner for a slot
  const findWinnerForSlot = (slot: number) => {
    const slotPicks = picksBySlot[slot];
    if (!slotPicks || slotPicks.length === 0) {
      return null; // No picks for this slot
    }

    // Find the closest pick(s)
    let minDistance = Infinity;
    let closestPicks: Array<{ userId: string; pickNumber: string }> = [];

    slotPicks.forEach((pick) => {
      const distance = calculateDistance(pick.pickNumber, pick3Result);
      if (distance < minDistance) {
        minDistance = distance;
        closestPicks = [pick];
      } else if (distance === minDistance) {
        closestPicks.push(pick);
      }
    });

    // If multiple picks are tied, the lower number wins
    let winner = closestPicks[0];
    if (closestPicks.length > 1) {
      closestPicks.forEach((pick) => {
        if (isLower(pick.pickNumber, pick3Result) && !isLower(winner.pickNumber, pick3Result)) {
          winner = pick;
        } else if (
          isLower(pick.pickNumber, pick3Result) === isLower(winner.pickNumber, pick3Result) &&
          parseInt(pick.pickNumber) < parseInt(winner.pickNumber)
        ) {
          winner = pick;
        }
      });
    }

    return {
      giveawayId: id,
      userId: winner.userId,
      slot,
      pickNumber: winner.pickNumber,
      distance: minDistance,
    };
  };

  // Handle Box Topper (slot 0) if exists
  if (giveaway.hasBoxTopper) {
    const boxTopperWinner = findWinnerForSlot(0);
    if (boxTopperWinner) {
      winners.push(boxTopperWinner);
    }
  }

  // Handle regular slots (1 to slotCount)
  for (let slot = 1; slot <= giveaway.slotCount; slot++) {
    const slotWinner = findWinnerForSlot(slot);
    if (slotWinner) {
      winners.push(slotWinner);
    }
  }

  // Create winner records
  if (winners.length > 0) {
    await prisma.giveawayWinner.createMany({
      data: winners,
    });
  }

  // Update giveaway status
  await prisma.giveaway.update({
    where: { id },
    data: {
      status: "COMPLETED",
      pick3Result,
      pick3Date: new Date(),
    },
  });

  // Send notifications to winners (grouped by user)
  if (winners.length > 0) {
    // Group winners by userId
    const winnersByUser = winners.reduce((acc, winner) => {
      if (!acc[winner.userId]) {
        acc[winner.userId] = [];
      }
      acc[winner.userId].push(winner.slot);
      return acc;
    }, {} as Record<string, number[]>);

    // Send one notification per user with all their winning slots
    for (const [userId, slots] of Object.entries(winnersByUser)) {
      try {
        await createGiveawayMultiWinNotification(
          userId,
          giveaway.title,
          id,
          slots
        );
      } catch (error) {
        console.error(`Failed to send notification to user ${userId}:`, error);
        // Continue with other notifications even if one fails
      }
    }

    console.log(`Sent ${Object.keys(winnersByUser).length} winner notifications`);
  }

  return NextResponse.json({
    success: true,
    winnersCount: winners.length,
    uniqueWinners: winners.length > 0 ? Object.keys(winners.reduce((acc, w) => ({ ...acc, [w.userId]: true }), {})).length : 0,
    pick3Result,
  });
}
