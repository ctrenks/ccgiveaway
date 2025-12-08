import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCreditsForTier } from "@/lib/subscriptions";

/**
 * Subscription Management Cron Job
 * 
 * Runs daily to:
 * 1. Grant monthly credits to active VIP members on their anniversary
 * 2. Expire subscriptions that have ended
 * 3. Reset free shipping eligibility monthly
 */
export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get("authorization");
    const vercelCron = request.headers.get("x-vercel-cron");
    
    const isAuthorized = 
      (process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`) ||
      vercelCron === "1";
    
    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const results = {
      creditsGranted: 0,
      subscriptionsExpired: 0,
      freeShippingReset: 0,
      errors: [] as string[],
    };

    // 1. Find active subscriptions that need monthly credits
    const activeUsers = await prisma.user.findMany({
      where: {
        subscriptionTier: {
          not: null,
        },
        subscriptionEnd: {
          gte: now, // Subscription hasn't expired
        },
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStart: true,
        lastCreditsGranted: true,
        giveawayCredits: true,
        freeShippingUsedAt: true,
      },
    });

    console.log(`Found ${activeUsers.length} active VIP users`);

    for (const user of activeUsers) {
      try {
        const subscriptionStart = user.subscriptionStart ? new Date(user.subscriptionStart) : null;
        const lastGranted = user.lastCreditsGranted ? new Date(user.lastCreditsGranted) : null;

        if (!subscriptionStart) continue;

        // Get the anniversary day (e.g., if subscribed on the 6th, anniversary is the 6th of each month)
        const anniversaryDay = subscriptionStart.getDate();
        const todayDay = now.getDate();

        // Check if today is the monthly anniversary AND we haven't granted credits this month yet
        const shouldGrantCredits =
          todayDay === anniversaryDay &&
          (!lastGranted || 
           (now.getMonth() !== lastGranted.getMonth() || now.getFullYear() !== lastGranted.getFullYear()));

        if (shouldGrantCredits && user.subscriptionTier) {
          const credits = getCreditsForTier(user.subscriptionTier as "BASIC" | "PLUS" | "PREMIUM");

          if (credits > 0) {
            const currentBalance = user.giveawayCredits || 0;

            await prisma.user.update({
              where: { id: user.id },
              data: {
                giveawayCredits: { increment: credits },
                lastCreditsGranted: now,
              },
            });

            // Log the credit grant
            await prisma.creditLog.create({
              data: {
                userId: user.id,
                amount: credits,
                reason: `Monthly VIP credits - ${user.subscriptionTier} tier`,
                adminId: "system",
                adminEmail: "system@cron",
                balanceBefore: currentBalance,
                balanceAfter: currentBalance + credits,
              },
            });

            results.creditsGranted++;
            console.log(`Granted ${credits} credits to user ${user.email} (${user.subscriptionTier}) - Anniversary day ${anniversaryDay}`);
          }
        }

        // Reset free shipping on the 20th of each month
        const dayOfMonth = now.getDate();
        if (dayOfMonth === 20 && user.freeShippingUsedAt) {
          const usedDate = new Date(user.freeShippingUsedAt);
          const monthsAgo =
            (now.getFullYear() - usedDate.getFullYear()) * 12 +
            (now.getMonth() - usedDate.getMonth());

          // Only reset if it was used in a previous month
          if (monthsAgo >= 1 || now.getMonth() !== usedDate.getMonth()) {
            await prisma.user.update({
              where: { id: user.id },
              data: {
                freeShippingUsedAt: null,
              },
            });
            results.freeShippingReset++;
            console.log(`Reset free shipping for user ${user.email} on the 20th`);
          }
        }
      } catch (error) {
        const errorMsg = `Error processing user ${user.id}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    // 2. Find and expire subscriptions that have ended
    const expiredUsers = await prisma.user.findMany({
      where: {
        subscriptionTier: {
          not: null,
        },
        subscriptionEnd: {
          lt: now, // Subscription end date has passed
        },
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
      },
    });

    console.log(`Found ${expiredUsers.length} expired subscriptions`);

    for (const user of expiredUsers) {
      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscriptionTier: null,
            subscriptionEnd: null,
            freeShippingUsedAt: null,
          },
        });

        // Update subscription record
        await prisma.subscription.updateMany({
          where: {
            userId: user.id,
            status: "ACTIVE",
          },
          data: {
            status: "EXPIRED",
          },
        });

        results.subscriptionsExpired++;
        console.log(`Expired subscription for user ${user.email} (was ${user.subscriptionTier})`);
      } catch (error) {
        const errorMsg = `Error expiring subscription for user ${user.id}: ${error}`;
        console.error(errorMsg);
        results.errors.push(errorMsg);
      }
    }

    console.log("Subscription management completed:", results);

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results,
    });
  } catch (error) {
    console.error("Subscription management cron error:", error);
    return NextResponse.json(
      {
        error: "Subscription management failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

