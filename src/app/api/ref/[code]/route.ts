import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  // Look up the referral code
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true },
  });

  if (!referrer) {
    // Invalid code - redirect to home
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Set referral cookie (expires in 30 days)
  const cookieStore = await cookies();
  cookieStore.set("referralCode", code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  // Redirect to the referral page with cookie set
  return NextResponse.redirect(new URL(`/ref/${code}/welcome`, request.url));
}

