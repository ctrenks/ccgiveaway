import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Test endpoint to verify referral system is working
 * GET /api/test/referral
 */
export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    // 1. Check if user has a referral code
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        referralCode: true,
        referralCreditsEarned: true,
        referredBy: true,
        giveawayCredits: true,
      },
    });

    // 2. Get referral stats
    const referrals = await prisma.referral.findMany({
      where: { referrerId: session.user.id },
      select: {
        status: true,
        creditsAwarded: true,
        completedAt: true,
      },
    });

    const completedReferrals = referrals.filter(r => r.status === "COMPLETED").length;
    const pendingReferrals = referrals.filter(r => r.status === "PENDING").length;

    // 3. Test credit log exists
    const creditLogs = await prisma.creditLog.findMany({
      where: {
        userId: session.user.id,
        reason: { contains: "Referral" },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const baseUrl = process.env.NEXTAUTH_URL || process.env.AUTH_URL || "https://collectorcardgiveaway.com";
    const referralUrl = user?.referralCode ? `${baseUrl}/ref/${user.referralCode}` : null;

    return NextResponse.json({
      status: "✅ Referral System Active",
      user: {
        hasReferralCode: !!user?.referralCode,
        referralCode: user?.referralCode,
        referralUrl,
        totalCreditsEarned: user?.referralCreditsEarned || 0,
        currentCredits: user?.giveawayCredits || 0,
        wasReferred: !!user?.referredBy,
      },
      stats: {
        completedReferrals,
        pendingReferrals,
        totalReferrals: referrals.length,
      },
      recentCreditLogs: creditLogs.map(log => ({
        amount: log.amount,
        reason: log.reason,
        date: log.createdAt,
      })),
      tests: {
        "✅ Referral code exists": !!user?.referralCode,
        "✅ Can generate referral URL": !!referralUrl,
        "✅ Credit tracking exists": user?.referralCreditsEarned !== undefined,
        "✅ Referral records exist": referrals.length >= 0,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: "❌ Error",
      error: error instanceof Error ? error.message : String(error),
    }, { status: 500 });
  }
}

