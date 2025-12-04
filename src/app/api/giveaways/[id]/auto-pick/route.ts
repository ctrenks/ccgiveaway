import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const { id } = await params;

  const giveaway = await prisma.giveaway.findUnique({
    where: { id },
  });

  if (!giveaway) {
    return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  }

  // Get pick counts per slot
  const slotCounts = await prisma.giveawayPick.groupBy({
    by: ["slot"],
    where: { giveawayId: id },
    _count: { id: true },
  });

  const slotCountMap: Record<number, number> = {};
  for (let i = 1; i <= giveaway.slotCount; i++) {
    slotCountMap[i] = 0;
  }
  slotCounts.forEach((s) => {
    slotCountMap[s.slot] = s._count.id;
  });

  // Find slot with least picks (best odds)
  let bestSlot = 1;
  let minPicks = Infinity;
  for (let i = 1; i <= giveaway.slotCount; i++) {
    if (slotCountMap[i] < minPicks) {
      minPicks = slotCountMap[i];
      bestSlot = i;
    }
  }

  // Get all pick numbers for the best slot
  const existingPicks = await prisma.giveawayPick.findMany({
    where: {
      giveawayId: id,
      slot: bestSlot,
    },
    select: { pickNumber: true },
  });

  // If user is logged in, also exclude their existing picks
  let userPickNumbers: string[] = [];
  if (session?.user?.id) {
    const userPicks = await prisma.giveawayPick.findMany({
      where: {
        giveawayId: id,
        userId: session.user.id,
        slot: bestSlot,
      },
      select: { pickNumber: true },
    });
    userPickNumbers = userPicks.map((p) => p.pickNumber);
  }

  // Find the number with biggest gap from existing picks
  const takenNumbers = new Set(existingPicks.map((p) => parseInt(p.pickNumber)));
  const userTakenNumbers = new Set(userPickNumbers.map((p) => parseInt(p)));

  let bestNumber = "500"; // Default to middle
  let maxGap = 0;

  if (takenNumbers.size === 0) {
    // No picks yet, suggest middle number
    bestNumber = "500";
  } else if (takenNumbers.size >= 1000) {
    // All numbers taken, find any available
    for (let i = 0; i <= 999; i++) {
      if (!userTakenNumbers.has(i)) {
        bestNumber = String(i).padStart(3, "0");
        break;
      }
    }
  } else {
    // Find biggest gap
    const sortedNumbers = Array.from(takenNumbers).sort((a, b) => a - b);

    // Check gap before first number
    if (sortedNumbers[0] > 0) {
      const gap = sortedNumbers[0];
      if (gap > maxGap) {
        maxGap = gap;
        // Pick the middle of this gap, avoiding user's picks
        let candidate = Math.floor(gap / 2);
        while (userTakenNumbers.has(candidate) && candidate < sortedNumbers[0]) {
          candidate++;
        }
        if (!userTakenNumbers.has(candidate)) {
          bestNumber = String(candidate).padStart(3, "0");
        }
      }
    }

    // Check gaps between numbers
    for (let i = 0; i < sortedNumbers.length - 1; i++) {
      const gap = sortedNumbers[i + 1] - sortedNumbers[i] - 1;
      if (gap > maxGap) {
        maxGap = gap;
        // Pick the middle of this gap
        let candidate = sortedNumbers[i] + Math.floor(gap / 2) + 1;
        while (userTakenNumbers.has(candidate) && candidate < sortedNumbers[i + 1]) {
          candidate++;
        }
        if (!userTakenNumbers.has(candidate) && candidate < sortedNumbers[i + 1]) {
          bestNumber = String(candidate).padStart(3, "0");
        }
      }
    }

    // Check gap after last number
    if (sortedNumbers[sortedNumbers.length - 1] < 999) {
      const gap = 999 - sortedNumbers[sortedNumbers.length - 1];
      if (gap > maxGap) {
        maxGap = gap;
        let candidate = sortedNumbers[sortedNumbers.length - 1] + Math.floor(gap / 2) + 1;
        while (userTakenNumbers.has(candidate) && candidate <= 999) {
          candidate++;
        }
        if (!userTakenNumbers.has(candidate) && candidate <= 999) {
          bestNumber = String(candidate).padStart(3, "0");
        }
      }
    }
  }

  return NextResponse.json({
    slot: bestSlot,
    pickNumber: bestNumber,
    slotPickCount: slotCountMap[bestSlot],
    reason: `Slot ${bestSlot} has the fewest picks (${slotCountMap[bestSlot]}). Number ${bestNumber} has the best gap from existing picks.`,
  });
}
