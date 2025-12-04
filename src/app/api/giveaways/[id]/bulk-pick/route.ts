import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

// Helper to get next business day draw schedule
// Draw: 7:30 PM EST, Entry Cutoff: 5:00 PM EST same day
function getDrawSchedule(): { drawDate: Date; entryCutoff: Date } {
  const now = new Date();
  
  // Find next business day
  const drawDay = new Date(now);
  drawDay.setDate(drawDay.getDate() + 1);
  
  // Skip weekends (0 = Sunday, 6 = Saturday)
  while (drawDay.getDay() === 0 || drawDay.getDay() === 6) {
    drawDay.setDate(drawDay.getDate() + 1);
  }

  // Create draw date at 7:30 PM EST
  // EST is UTC-5, so 7:30 PM EST = 00:30 UTC next day
  const drawDate = new Date(drawDay);
  drawDate.setUTCHours(0, 30, 0, 0);
  drawDate.setUTCDate(drawDate.getUTCDate() + 1);
  
  // Create entry cutoff at 5:00 PM EST same day as draw
  // 5:00 PM EST = 22:00 UTC
  const entryCutoff = new Date(drawDay);
  entryCutoff.setUTCHours(22, 0, 0, 0);

  return { drawDate, entryCutoff };
}

// Find best available pick for a slot
async function findBestPick(
  giveawayId: string,
  slot: number,
  userId: string,
  existingUserPicks: Set<string>
): Promise<string | null> {
  // Get all picks for this slot
  const picks = await prisma.giveawayPick.findMany({
    where: { giveawayId, slot },
    select: { pickNumber: true },
  });

  const takenNumbers = new Set(picks.map((p) => parseInt(p.pickNumber)));

  // Find biggest gap
  const sortedTaken = Array.from(takenNumbers).sort((a, b) => a - b);

  let bestNumber: number | null = null;
  let maxGap = 0;

  if (sortedTaken.length === 0) {
    bestNumber = 500; // Start in the middle
  } else {
    // Check gap before first
    if (sortedTaken[0] > 0) {
      const gap = sortedTaken[0];
      if (gap > maxGap) {
        const candidate = Math.floor(gap / 2);
        if (!existingUserPicks.has(`${slot}-${candidate}`)) {
          maxGap = gap;
          bestNumber = candidate;
        }
      }
    }

    // Check gaps between numbers
    for (let i = 0; i < sortedTaken.length - 1; i++) {
      const gap = sortedTaken[i + 1] - sortedTaken[i] - 1;
      if (gap > maxGap) {
        const candidate = sortedTaken[i] + Math.floor(gap / 2) + 1;
        if (!existingUserPicks.has(`${slot}-${candidate}`)) {
          maxGap = gap;
          bestNumber = candidate;
        }
      }
    }

    // Check gap after last
    if (sortedTaken[sortedTaken.length - 1] < 999) {
      const gap = 999 - sortedTaken[sortedTaken.length - 1];
      if (gap > maxGap) {
        const candidate = sortedTaken[sortedTaken.length - 1] + Math.floor(gap / 2) + 1;
        if (!existingUserPicks.has(`${slot}-${candidate}`)) {
          maxGap = gap;
          bestNumber = candidate;
        }
      }
    }
  }

  // If best number is already taken by user, find any available
  if (bestNumber !== null && existingUserPicks.has(`${slot}-${bestNumber}`)) {
    for (let i = 0; i <= 999; i++) {
      if (!takenNumbers.has(i) && !existingUserPicks.has(`${slot}-${i}`)) {
        bestNumber = i;
        break;
      }
    }
  }

  return bestNumber !== null ? String(bestNumber).padStart(3, "0") : null;
}

// Find the slot with fewest picks
async function findBestSlot(
  giveawayId: string,
  slotCount: number,
  hasBoxTopper: boolean,
  excludeBoxTopper: boolean = true
): Promise<number> {
  const slotCounts = await prisma.giveawayPick.groupBy({
    by: ["slot"],
    where: { giveawayId },
    _count: { id: true },
  });

  const countMap: Record<number, number> = {};
  const minSlot = hasBoxTopper && !excludeBoxTopper ? 0 : 1;

  for (let i = minSlot; i <= slotCount; i++) {
    countMap[i] = 0;
  }

  slotCounts.forEach((s) => {
    if (s.slot >= minSlot) {
      countMap[s.slot] = s._count.id;
    }
  });

  let bestSlot = 1;
  let minPicks = Infinity;

  for (let i = minSlot; i <= slotCount; i++) {
    if (countMap[i] < minPicks) {
      minPicks = countMap[i];
      bestSlot = i;
    }
  }

  return bestSlot;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Must be logged in" }, { status: 401 });
  }

  if (session.user.role === ROLES.BANNED) {
    return NextResponse.json(
      { error: "Your account has been restricted from participating in giveaways" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const { count, targetSlot, useFreeEntries } = body;

  // Validate count
  const pickCount = Math.min(Math.max(1, count || 1), 100); // 1-100 picks max

  // Get giveaway
  const giveaway = await prisma.giveaway.findUnique({
    where: { id },
  });

  if (!giveaway) {
    return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  }

  if (!["OPEN", "FILLING"].includes(giveaway.status)) {
    return NextResponse.json(
      { error: "This giveaway is no longer accepting picks" },
      { status: 400 }
    );
  }

  if (giveaway.entryCutoff && new Date() > giveaway.entryCutoff) {
    return NextResponse.json({ error: "Entry cutoff has passed" }, { status: 400 });
  }

  // Get user's current picks to avoid duplicates
  const userPicks = await prisma.giveawayPick.findMany({
    where: { giveawayId: id, userId: session.user.id },
    select: { slot: true, pickNumber: true, isFreeEntry: true },
  });

  const existingUserPicks = new Set(
    userPicks.map((p) => `${p.slot}-${parseInt(p.pickNumber)}`)
  );
  const freeEntriesUsed = userPicks.filter((p) => p.isFreeEntry).length;
  let freeEntriesRemaining = giveaway.freeEntriesPerUser - freeEntriesUsed;

  // Get user credits
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { giveawayCredits: true },
  });

  let creditsAvailable = user?.giveawayCredits || 0;

  // Track results
  const results: Array<{ slot: number; pickNumber: string; isFreeEntry: boolean }> = [];
  let totalCreditsUsed = 0;
  let totalFreeUsed = 0;

  // Make picks one at a time
  for (let i = 0; i < pickCount; i++) {
    // Determine which slot to use
    let slot: number;
    if (targetSlot !== undefined && targetSlot !== null) {
      slot = targetSlot;
    } else {
      // Find best slot (exclude box topper from auto-pick due to 3x cost)
      slot = await findBestSlot(id, giveaway.slotCount, giveaway.hasBoxTopper, true);
    }

    // Box topper costs 3x the base credit cost
    const isBoxTopper = slot === 0;
    const baseCost = giveaway.creditCostPerPick || 1;
    const creditCost = isBoxTopper ? baseCost * 3 : baseCost;

    // Determine if using free entry or credits
    let isFreeEntry = false;
    if (useFreeEntries && freeEntriesRemaining > 0 && !isBoxTopper) {
      isFreeEntry = true;
      freeEntriesRemaining--;
      totalFreeUsed++;
    } else if (creditsAvailable >= creditCost) {
      creditsAvailable -= creditCost;
      totalCreditsUsed += creditCost;
    } else {
      // Not enough credits, stop
      break;
    }

    // Find best pick number for this slot
    const pickNumber = await findBestPick(id, slot, session.user.id, existingUserPicks);

    if (!pickNumber) {
      // No available numbers in this slot
      if (isFreeEntry) {
        freeEntriesRemaining++;
        totalFreeUsed--;
      } else {
        creditsAvailable += creditCost;
        totalCreditsUsed -= creditCost;
      }
      continue;
    }

    // Check if user already has this pick
    if (existingUserPicks.has(`${slot}-${parseInt(pickNumber)}`)) {
      if (isFreeEntry) {
        freeEntriesRemaining++;
        totalFreeUsed--;
      } else {
        creditsAvailable += creditCost;
        totalCreditsUsed -= creditCost;
      }
      continue;
    }

    // Create the pick
    await prisma.giveawayPick.create({
      data: {
        giveawayId: id,
        userId: session.user.id,
        slot,
        pickNumber,
        isFreeEntry,
      },
    });

    existingUserPicks.add(`${slot}-${parseInt(pickNumber)}`);
    results.push({ slot, pickNumber, isFreeEntry });
  }

  // Deduct credits used
  if (totalCreditsUsed > 0) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { giveawayCredits: { decrement: totalCreditsUsed } },
    });
  }

  // Update giveaway pick count
  const newTotalPicks = await prisma.giveawayPick.count({
    where: { giveawayId: id },
  });

  // Check if minimum participation reached
  if (giveaway.status === "OPEN" && newTotalPicks >= giveaway.minParticipation) {
    const { drawDate, entryCutoff } = getDrawSchedule();

    await prisma.giveaway.update({
      where: { id },
      data: { status: "FILLING", totalPicks: newTotalPicks, drawDate, entryCutoff },
    });
  } else {
    await prisma.giveaway.update({
      where: { id },
      data: { totalPicks: newTotalPicks },
    });
  }

  return NextResponse.json({
    success: true,
    picksCreated: results.length,
    creditsUsed: totalCreditsUsed,
    freeEntriesUsed: totalFreeUsed,
    picks: results,
  });
}
