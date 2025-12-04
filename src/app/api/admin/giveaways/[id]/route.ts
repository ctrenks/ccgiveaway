import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export async function GET(
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
    include: {
      _count: {
        select: { picks: true, winners: true },
      },
    },
  });

  if (!giveaway) {
    return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  }

  return NextResponse.json({ giveaway });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const {
    title,
    description,
    slotCount,
    hasBoxTopper,
    minParticipation,
    freeEntriesPerUser,
    creditCostPerPick,
    prizeValue,
  } = body;

  // Get current giveaway to check if we can modify certain fields
  const currentGiveaway = await prisma.giveaway.findUnique({
    where: { id },
  });

  if (!currentGiveaway) {
    return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  }

  // Build update data
  const updateData: Record<string, unknown> = {};

  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description;
  if (minParticipation !== undefined) updateData.minParticipation = minParticipation;
  if (freeEntriesPerUser !== undefined) updateData.freeEntriesPerUser = freeEntriesPerUser;
  if (creditCostPerPick !== undefined) updateData.creditCostPerPick = Math.min(100, Math.max(1, creditCostPerPick));
  if (prizeValue !== undefined) updateData.prizeValue = prizeValue;

  // Only allow changing slot count and box topper if no picks yet
  if (currentGiveaway.totalPicks === 0) {
    if (slotCount !== undefined) updateData.slotCount = slotCount;
    if (hasBoxTopper !== undefined) updateData.hasBoxTopper = hasBoxTopper;
  }

  const giveaway = await prisma.giveaway.update({
    where: { id },
    data: updateData,
    include: {
      _count: {
        select: { picks: true, winners: true },
      },
    },
  });

  return NextResponse.json({ giveaway });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Check if giveaway has picks - don't allow deletion
  const giveaway = await prisma.giveaway.findUnique({
    where: { id },
    select: { totalPicks: true },
  });

  if (!giveaway) {
    return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  }

  if (giveaway.totalPicks > 0) {
    return NextResponse.json(
      { error: "Cannot delete giveaway with picks. Cancel it instead." },
      { status: 400 }
    );
  }

  await prisma.giveaway.delete({
    where: { id },
  });

  return NextResponse.json({ success: true });
}

