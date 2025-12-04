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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const giveaway = await prisma.giveaway.findUnique({
    where: { id },
  });

  if (!giveaway) {
    return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  }

  if (!["OPEN", "FILLING"].includes(giveaway.status)) {
    return NextResponse.json(
      { error: "Can only recalculate draw for open/filling giveaways" },
      { status: 400 }
    );
  }

  const { drawDate, entryCutoff } = getDrawSchedule();

  const updated = await prisma.giveaway.update({
    where: { id },
    data: { drawDate, entryCutoff },
  });

  return NextResponse.json({
    success: true,
    drawDate: updated.drawDate,
    entryCutoff: updated.entryCutoff,
  });
}

