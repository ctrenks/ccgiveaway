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
  // EST is UTC-5, so 7:30 PM EST = 00:30 UTC next day (in standard time)
  // But to be safe, we'll calculate based on the draw day
  const drawDate = new Date(drawDay);
  drawDate.setUTCHours(0, 30, 0, 0); // This puts us at 00:30 UTC = 7:30 PM EST previous calendar day
  drawDate.setUTCDate(drawDate.getUTCDate() + 1); // Move to correct day

  // Create entry cutoff at 5:00 PM EST same day as draw
  // 5:00 PM EST = 22:00 UTC
  const entryCutoff = new Date(drawDay);
  entryCutoff.setUTCHours(22, 0, 0, 0);

  return { drawDate, entryCutoff };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Must be logged in" }, { status: 401 });
  }

  // Check if user is banned
  if (session.user.role === ROLES.BANNED) {
    return NextResponse.json(
      { error: "Your account has been restricted from participating in giveaways" },
      { status: 403 }
    );
  }

  const { id } = await params;
  const body = await request.json();
  const { slot, pickNumber, useFreeEntry } = body;

  // Validate slot and pickNumber
  if (slot === undefined || slot === null || !pickNumber) {
    return NextResponse.json(
      { error: "Slot and pick number are required" },
      { status: 400 }
    );
  }

  // Validate pickNumber format (001-999)
  const pickNum = String(pickNumber).padStart(3, "0");
  if (!/^[0-9]{3}$/.test(pickNum) || parseInt(pickNum) < 0 || parseInt(pickNum) > 999) {
    return NextResponse.json(
      { error: "Pick number must be between 000 and 999" },
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

  // Check if giveaway is accepting picks
  if (giveaway.status === "CLOSED" || giveaway.status === "COMPLETED" || giveaway.status === "CANCELLED") {
    return NextResponse.json(
      { error: "This giveaway is no longer accepting picks" },
      { status: 400 }
    );
  }

  // Check cutoff time
  if (giveaway.entryCutoff && new Date() > giveaway.entryCutoff) {
    return NextResponse.json(
      { error: "Entry cutoff has passed" },
      { status: 400 }
    );
  }

  // Validate slot number
  const minSlot = giveaway.hasBoxTopper ? 0 : 1;
  if (slot < minSlot || slot > giveaway.slotCount) {
    return NextResponse.json(
      { error: `Slot must be between ${minSlot} and ${giveaway.slotCount}` },
      { status: 400 }
    );
  }

  // Check if user already has this exact pick
  const existingPick = await prisma.giveawayPick.findFirst({
    where: {
      giveawayId: id,
      userId: session.user.id,
      slot,
      pickNumber: pickNum,
    },
  });

  if (existingPick) {
    return NextResponse.json(
      { error: "You already have this pick" },
      { status: 400 }
    );
  }

  // Box topper (slot 0) costs 3x the base credit cost
  const isBoxTopper = slot === 0;
  const baseCost = giveaway.creditCostPerPick || 1;
  const creditCost = isBoxTopper ? baseCost * 3 : baseCost;

  // Check free entries vs credits
  let isFreeEntry = false;

  if (useFreeEntry && !isBoxTopper) {
    // Free entries cannot be used for box topper
    const freeEntriesUsed = await prisma.giveawayPick.count({
      where: {
        giveawayId: id,
        userId: session.user.id,
        isFreeEntry: true,
      },
    });

    if (freeEntriesUsed >= giveaway.freeEntriesPerUser) {
      return NextResponse.json(
        { error: "No free entries remaining" },
        { status: 400 }
      );
    }
    isFreeEntry = true;
  } else {
    // Check user has enough credits
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { giveawayCredits: true },
    });

    if (!user || user.giveawayCredits < creditCost) {
      return NextResponse.json(
        { error: isBoxTopper
            ? `Box topper requires ${creditCost} credits. You have ${user?.giveawayCredits || 0}.`
            : "Not enough credits. Use a free entry or purchase more credits."
        },
        { status: 400 }
      );
    }

    // Deduct credits
    await prisma.user.update({
      where: { id: session.user.id },
      data: { giveawayCredits: { decrement: creditCost } },
    });
  }

  // Create the pick
  const pick = await prisma.giveawayPick.create({
    data: {
      giveawayId: id,
      userId: session.user.id,
      slot,
      pickNumber: pickNum,
      isFreeEntry,
    },
  });

  // Update total picks counter
  const newTotalPicks = await prisma.giveawayPick.count({
    where: { giveawayId: id },
  });

  // Check if we hit minimum participation
  if (giveaway.status === "OPEN" && newTotalPicks >= giveaway.minParticipation) {
    const { drawDate, entryCutoff } = getDrawSchedule();

    await prisma.giveaway.update({
      where: { id },
      data: {
        status: "FILLING",
        totalPicks: newTotalPicks,
        drawDate,
        entryCutoff,
      },
    });
  } else {
    await prisma.giveaway.update({
      where: { id },
      data: { totalPicks: newTotalPicks },
    });
  }

  return NextResponse.json({
    success: true,
    pick: {
      slot: pick.slot,
      pickNumber: pick.pickNumber,
      isFreeEntry: pick.isFreeEntry,
    },
  });
}
