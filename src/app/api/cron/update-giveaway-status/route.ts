import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Vercel Cron - runs every hour to check and update giveaway statuses
// Add to vercel.json: { "path": "/api/cron/update-giveaway-status", "schedule": "*/15 * * * *" }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      const vercelCron = request.headers.get("x-vercel-cron");
      if (!vercelCron) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const now = new Date();
    
    // Find FILLING giveaways that have passed their entry cutoff
    const fillingGiveaways = await prisma.giveaway.findMany({
      where: {
        status: "FILLING",
        entryCutoff: {
          lte: now,
        },
      },
    });

    // Update them to CLOSED
    const updatePromises = fillingGiveaways.map((giveaway) =>
      prisma.giveaway.update({
        where: { id: giveaway.id },
        data: { status: "CLOSED" },
      })
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      closedCount: fillingGiveaways.length,
      giveawayIds: fillingGiveaways.map(g => g.id),
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error("Error updating giveaway status:", error);
    return NextResponse.json(
      { error: "Failed to update giveaway status" },
      { status: 500 }
    );
  }
}

