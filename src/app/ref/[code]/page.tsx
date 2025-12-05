import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

interface Props {
  params: Promise<{ code: string }>;
}

export default async function ReferralPage({ params }: Props) {
  const { code } = await params;

  // Look up the referral code
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, displayName: true, name: true },
  });

  if (!referrer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Invalid Referral Link</h1>
          <p className="text-slate-400 mb-6">
            This referral link is not valid or has expired.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg transition-colors"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  // Set referral cookie (expires in 30 days)
  const cookieStore = await cookies();
  cookieStore.set("referralCode", code, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  // Show welcome page with sign up prompt
  const referrerName = referrer.displayName || referrer.name || "A friend";

  return (
    <div className="min-h-screen flex items-center justify-center py-12">
      <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 text-center max-w-lg mx-4">
        <div className="text-6xl mb-4">🎁</div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Welcome to Collector Card Giveaway!
        </h1>
        <p className="text-slate-400 mb-6">
          <span className="text-purple-400 font-medium">{referrerName}</span> invited you to join!
        </p>

        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">What You Get:</h2>
          <ul className="text-left space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span><strong>10 free entries</strong> on every giveaway</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Chance to win <strong>rare cards</strong> weekly</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Shop exclusive <strong>trading cards</strong></span>
            </li>
            <li className="flex items-center gap-2">
              <span className="text-green-400">✓</span>
              <span>Earn <strong>credits</strong> with purchases</span>
            </li>
          </ul>
        </div>

        <p className="text-sm text-slate-500 mb-6">
          When you complete registration, {referrerName} will receive 100 bonus credits as a thank you!
        </p>

        <Link
          href="/auth/signin"
          className="block w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold rounded-xl text-lg transition-all shadow-lg shadow-purple-500/30"
        >
          Sign Up Now →
        </Link>

        <p className="mt-4 text-xs text-slate-600">
          Already have an account?{" "}
          <Link href="/auth/signin" className="text-purple-400 hover:underline">
            Sign in here
          </Link>
        </p>
      </div>
    </div>
  );
}

