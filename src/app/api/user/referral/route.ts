import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Generate a unique referral code
function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get user with referral info
  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      referralCode: true,
      referralCreditsEarned: true,
      referrals: {
        select: {
          id: true,
          referredEmail: true,
          status: true,
          creditsAwarded: true,
          createdAt: true,
          completedAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  // Generate referral code if user doesn't have one
  if (!user?.referralCode) {
    let code = generateReferralCode();
    let attempts = 0;

    // Make sure code is unique
    while (attempts < 10) {
      const existing = await prisma.user.findUnique({
        where: { referralCode: code },
      });
      if (!existing) break;
      code = generateReferralCode();
      attempts++;
    }

    user = await prisma.user.update({
      where: { id: session.user.id },
      data: { referralCode: code },
      select: {
        referralCode: true,
        referralCreditsEarned: true,
        referrals: {
          select: {
            id: true,
            referredEmail: true,
            status: true,
            creditsAwarded: true,
            createdAt: true,
            completedAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  }

  const baseUrl = process.env.NEXTAUTH_URL || "https://collectorcardgiveaway.com";
  const referralUrl = `${baseUrl}/ref/${user.referralCode}`;

  return NextResponse.json({
    referralCode: user.referralCode,
    referralUrl,
    totalCreditsEarned: user.referralCreditsEarned,
    referrals: user.referrals,
    completedCount: user.referrals.filter((r) => r.status === "COMPLETED").length,
    pendingCount: user.referrals.filter((r) => r.status === "PENDING").length,
  });
}
