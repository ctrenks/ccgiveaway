import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Email from "next-auth/providers/email";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { sendVerificationRequest } from "@/lib/email";
import { cookies } from "next/headers";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  providers: [
    Email({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest,
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // Check for referral cookie when a new user is created
      try {
        const cookieStore = await cookies();
        const referralCode = cookieStore.get("referralCode")?.value;

        if (referralCode && user.id && user.email) {
          // Find the referrer
          const referrer = await prisma.user.findUnique({
            where: { referralCode },
            select: { id: true },
          });

          if (referrer && referrer.id !== user.id) {
            // Award credits to referrer
            await prisma.$transaction([
              // Update referrer credits
              prisma.user.update({
                where: { id: referrer.id },
                data: {
                  giveawayCredits: { increment: 100 },
                  referralCreditsEarned: { increment: 100 },
                },
              }),
              // Mark new user as referred
              prisma.user.update({
                where: { id: user.id },
                data: { referredBy: referrer.id },
              }),
              // Create referral record
              prisma.referral.create({
                data: {
                  referrerId: referrer.id,
                  referredEmail: user.email,
                  referredUserId: user.id,
                  creditsAwarded: 100,
                  status: "COMPLETED",
                  completedAt: new Date(),
                },
              }),
              // Log the credit addition
              prisma.creditLog.create({
                data: {
                  userId: referrer.id,
                  amount: 100,
                  reason: `Referral bonus: ${user.email} signed up`,
                  adminId: "system",
                  adminEmail: "system@collectorcardgiveaway.com",
                  balanceBefore: 0, // Will be approximate
                  balanceAfter: 0,  // Will be approximate
                },
              }),
            ]);

            // Clear the referral cookie
            cookieStore.delete("referralCode");
          }
        }
      } catch (error) {
        console.error("Error processing referral:", error);
        // Don't fail user creation if referral processing fails
      }
    },
  },
  session: {
    strategy: "database",
  },
});
