import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export async function GET() {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const giveaways = await prisma.giveaway.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { picks: true, winners: true },
      },
    },
  });

  return NextResponse.json({ giveaways });
}

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    title,
    description,
    image,
    slotCount,
    minParticipation,
    freeEntriesPerUser,
    prizeValue,
  } = body;

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  if (!slotCount || slotCount < 1 || slotCount > 100) {
    return NextResponse.json(
      { error: "Slot count must be between 1 and 100" },
      { status: 400 }
    );
  }

  const giveaway = await prisma.giveaway.create({
    data: {
      title,
      description,
      image,
      slotCount: slotCount || 36,
      minParticipation: minParticipation || 10000,
      freeEntriesPerUser: freeEntriesPerUser ?? 10,
      prizeValue: prizeValue ? prizeValue : null,
      status: "OPEN",
    },
  });

  return NextResponse.json({ giveaway });
}
