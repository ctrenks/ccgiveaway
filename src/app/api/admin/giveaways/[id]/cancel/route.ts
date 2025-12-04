import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Get giveaway
  const giveaway = await prisma.giveaway.findUnique({
    where: { id },
  });

  if (!giveaway) {
    return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  }

  if (giveaway.status === "COMPLETED") {
    return NextResponse.json(
      { error: "Cannot cancel a completed giveaway" },
      { status: 400 }
    );
  }

  if (giveaway.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Giveaway is already cancelled" },
      { status: 400 }
    );
  }

  // Get all picks that used credits (not free entries)
  const creditPicks = await prisma.giveawayPick.findMany({
    where: {
      giveawayId: id,
      isFreeEntry: false,
    },
    select: {
      userId: true,
    },
  });

  // Count credits to refund per user
  const refundsPerUser: Record<string, number> = {};
  creditPicks.forEach((pick) => {
    refundsPerUser[pick.userId] = (refundsPerUser[pick.userId] || 0) + 1;
  });

  // Refund credits to each user
  const refundPromises = Object.entries(refundsPerUser).map(([userId, credits]) =>
    prisma.user.update({
      where: { id: userId },
      data: { giveawayCredits: { increment: credits } },
    })
  );

  await Promise.all(refundPromises);

  // Update giveaway status
  await prisma.giveaway.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  // Calculate totals for response
  const totalCreditsRefunded = Object.values(refundsPerUser).reduce((a, b) => a + b, 0);
  const usersRefunded = Object.keys(refundsPerUser).length;

  return NextResponse.json({
    success: true,
    message: "Giveaway cancelled and credits refunded",
    totalCreditsRefunded,
    usersRefunded,
    totalPicks: giveaway.totalPicks,
    // Note: Free entries are not refunded - users get new free entries on new giveaways
  });
}
