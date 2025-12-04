import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const giveaway = await prisma.giveaway.findUnique({
    where: { id },
    include: {
      _count: {
        select: { picks: true },
      },
      winners: {
        include: {
          // We'll need to get user info separately
        },
      },
    },
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
  slotCounts.forEach((s) => {
    slotCountMap[s.slot] = s._count.id;
  });

  // If user is logged in, get their picks and free entries remaining
  let userPicks: { slot: number; pickNumber: string; isFreeEntry: boolean }[] = [];
  let freeEntriesUsed = 0;

  if (session?.user?.id) {
    const picks = await prisma.giveawayPick.findMany({
      where: {
        giveawayId: id,
        userId: session.user.id,
      },
      select: {
        slot: true,
        pickNumber: true,
        isFreeEntry: true,
      },
    });
    userPicks = picks;
    freeEntriesUsed = picks.filter((p) => p.isFreeEntry).length;
  }

  // Get winner user info if giveaway is completed
  let winnersWithUsers: Array<{
    slot: number;
    pickNumber: string;
    distance: number;
    userId: string;
    userName: string | null;
  }> = [];

  if (giveaway.status === "COMPLETED" && giveaway.winners.length > 0) {
    const winnerUserIds = giveaway.winners.map((w) => w.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: winnerUserIds } },
      select: { id: true, displayName: true, name: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u.displayName || u.name]));

    winnersWithUsers = giveaway.winners.map((w) => ({
      slot: w.slot,
      pickNumber: w.pickNumber,
      distance: w.distance,
      userId: w.userId,
      userName: userMap.get(w.userId) || "Anonymous",
    }));
  }

  return NextResponse.json({
    giveaway: {
      ...giveaway,
      slotCounts: slotCountMap,
      winners: winnersWithUsers,
    },
    userPicks,
    freeEntriesUsed,
    freeEntriesRemaining: giveaway.freeEntriesPerUser - freeEntriesUsed,
  });
}

