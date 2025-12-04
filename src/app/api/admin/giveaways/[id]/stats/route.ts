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

  // Count credit picks (non-free)
  const creditPicks = await prisma.giveawayPick.count({
    where: {
      giveawayId: id,
      isFreeEntry: false,
    },
  });

  // Count free picks
  const freePicks = await prisma.giveawayPick.count({
    where: {
      giveawayId: id,
      isFreeEntry: true,
    },
  });

  // Count unique users
  const uniqueUsers = await prisma.giveawayPick.groupBy({
    by: ["userId"],
    where: { giveawayId: id },
  });

  return NextResponse.json({
    creditPicks,
    freePicks,
    totalPicks: creditPicks + freePicks,
    uniqueUsers: uniqueUsers.length,
  });
}

