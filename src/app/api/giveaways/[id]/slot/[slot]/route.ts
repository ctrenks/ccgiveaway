import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; slot: string }> }
) {
  const { id, slot } = await params;
  const slotNum = parseInt(slot);

  if (isNaN(slotNum)) {
    return NextResponse.json({ error: "Invalid slot" }, { status: 400 });
  }

  // Get all picks for this slot (just the numbers, not user info for privacy)
  const picks = await prisma.giveawayPick.findMany({
    where: {
      giveawayId: id,
      slot: slotNum,
    },
    select: {
      pickNumber: true,
    },
    orderBy: {
      pickNumber: "asc",
    },
  });

  const takenNumbers = picks.map((p) => p.pickNumber);

  // Find gaps in the number sequence
  const takenSet = new Set(takenNumbers.map((n) => parseInt(n)));
  const gaps: Array<{ start: number; end: number; size: number }> = [];

  let gapStart: number | null = null;
  for (let i = 0; i <= 999; i++) {
    if (!takenSet.has(i)) {
      if (gapStart === null) {
        gapStart = i;
      }
    } else {
      if (gapStart !== null) {
        gaps.push({
          start: gapStart,
          end: i - 1,
          size: i - gapStart,
        });
        gapStart = null;
      }
    }
  }
  // Check if there's a gap at the end
  if (gapStart !== null) {
    gaps.push({
      start: gapStart,
      end: 999,
      size: 1000 - gapStart,
    });
  }

  // Sort gaps by size (largest first)
  gaps.sort((a, b) => b.size - a.size);

  return NextResponse.json({
    slot: slotNum,
    takenNumbers,
    totalTaken: takenNumbers.length,
    totalAvailable: 1000 - takenNumbers.length,
    largestGaps: gaps.slice(0, 5), // Top 5 largest gaps
  });
}

