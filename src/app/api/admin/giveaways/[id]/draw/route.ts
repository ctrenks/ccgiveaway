import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

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

  for (let slot = 1; slot <= giveaway.slotCount; slot++) {
    const slotPicks = picksBySlot[slot];
    if (!slotPicks || slotPicks.length === 0) {
      continue; // No picks for this slot
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

    winners.push({
      giveawayId: id,
      userId: winner.userId,
      slot,
      pickNumber: winner.pickNumber,
      distance: minDistance,
    });
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

  return NextResponse.json({
    success: true,
    winnersCount: winners.length,
    pick3Result,
  });
}
