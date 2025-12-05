import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  fetchTCGPlayerProduct,
  calculateDiscountedPrice,
  type ImportSettings,
} from "@/lib/tcgplayer";

// Vercel Cron - runs every hour, but only syncs products older than 3 days
// Add to vercel.json: { "crons": [{ "path": "/api/cron/sync-prices", "schedule": "0 * * * *" }] }

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (set CRON_SECRET in Vercel env)
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Also allow Vercel's cron header
      const vercelCron = request.headers.get("x-vercel-cron");
      if (!vercelCron) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    // Check if auto-sync is enabled
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    if (settings && !settings.autoSyncEnabled) {
      return NextResponse.json({ message: "Auto-sync is disabled" });
    }

    const discountSettings: ImportSettings = {
      discountType: (settings?.discountType as "percentage" | "fixed") || "percentage",
      discountValue: settings?.discountValue ? Number(settings.discountValue) : 10,
    };

    // Get all products with TCGPlayer IDs that need syncing
    const syncInterval = settings?.syncIntervalDays || 3;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - syncInterval);

    const productsToSync = await prisma.product.findMany({
      where: {
        tcgPlayerId: { not: null },
        tcgPlayerUrl: { not: null },
        OR: [
          { lastPriceSync: null },
          { lastPriceSync: { lt: cutoffDate } },
        ],
      },
      take: 20, // Process in batches to avoid timeout (runs hourly now)
    });

    const results = {
      total: productsToSync.length,
      updated: 0,
      failed: 0,
      skipped: 0,
      requiresReview: 0,
      details: [] as Array<{ id: string; name: string; status: string; oldPrice?: number; newPrice?: number; reason?: string }>,
    };

    for (const product of productsToSync) {
      try {
        if (!product.tcgPlayerUrl) {
          results.skipped++;
          continue;
        }

        const tcgProduct = await fetchTCGPlayerProduct(product.tcgPlayerUrl);
        if (!tcgProduct) {
          results.failed++;
          results.details.push({
            id: product.id,
            name: product.name,
            status: "fetch_failed",
          });
          continue;
        }

        // Use foil price if product is foil, otherwise use normal price
        const originalPrice = product.isFoil 
          ? (tcgProduct.foilPrice || tcgProduct.marketPrice)
          : (tcgProduct.marketPrice || tcgProduct.foilPrice);
        
        if (!originalPrice) {
          results.skipped++;
          results.details.push({
            id: product.id,
            name: product.name,
            status: "no_price",
          });
          continue;
        }

        const newPrice = calculateDiscountedPrice(originalPrice, discountSettings);
        const oldPrice = Number(product.price);

        // Failsafe 1: Skip if price is 0 (likely an error)
        if (originalPrice === 0 || newPrice === 0) {
          results.skipped++;
          results.details.push({
            id: product.id,
            name: product.name,
            status: "skipped_zero_price",
            oldPrice,
            newPrice: 0,
            reason: "Price is $0 - likely scraping error",
          });
          console.warn(`Skipped ${product.name}: Price is $0`);
          continue;
        }

        // Failsafe 2: Check if price change is more than 10%
        const priceChangePercent = oldPrice > 0 
          ? Math.abs((newPrice - oldPrice) / oldPrice) * 100 
          : 0;

        if (priceChangePercent > 10) {
          // Don't auto-update - flag for admin review
          results.requiresReview++;
          results.details.push({
            id: product.id,
            name: product.name,
            status: "requires_review",
            oldPrice,
            newPrice,
            reason: `Price change: ${priceChangePercent.toFixed(1)}% (${oldPrice > newPrice ? 'decrease' : 'increase'})`,
          });
          console.warn(`Flagged for review: ${product.name} - ${priceChangePercent.toFixed(1)}% change ($${oldPrice} → $${newPrice})`);
          
          // Update lastPriceSync so we don't keep checking this same product every hour
          await prisma.product.update({
            where: { id: product.id },
            data: {
              lastPriceSync: new Date(),
            },
          });
          continue;
        }

        // Safe to update - price change is less than 10%
        await prisma.product.update({
          where: { id: product.id },
          data: {
            originalPrice: originalPrice,
            price: newPrice,
            lastPriceSync: new Date(),
            // Optionally update image if it changed
            image: tcgProduct.imageUrl || product.image,
          },
        });

        results.updated++;
        results.details.push({
          id: product.id,
          name: product.name,
          status: "updated",
          oldPrice,
          newPrice,
          reason: priceChangePercent > 0 ? `${priceChangePercent.toFixed(1)}% change` : "no change",
        });

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Failed to sync product ${product.id}:`, error);
        results.failed++;
        results.details.push({
          id: product.id,
          name: product.name,
          status: "error",
        });
      }
    }

    // Log the sync
    console.log(`Price sync completed: ${results.updated} updated, ${results.requiresReview} require review, ${results.failed} failed, ${results.skipped} skipped`);

    // Log items requiring review for admin attention
    if (results.requiresReview > 0) {
      const reviewItems = results.details.filter(d => d.status === "requires_review");
      console.log("⚠️ Items requiring admin review:", JSON.stringify(reviewItems, null, 2));
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.updated} products${results.requiresReview > 0 ? `, ${results.requiresReview} require review` : ''}`,
      results,
    });
  } catch (error) {
    console.error("Cron sync error:", error);
    return NextResponse.json(
      { error: "Sync failed" },
      { status: 500 }
    );
  }
}

// POST - Manual trigger for sync (admin only)
export async function POST(request: NextRequest) {
  try {
    // For manual triggers, we'll reuse the GET logic
    // In production, you'd add proper auth here
    const cronSecret = process.env.CRON_SECRET || "manual-trigger";

    const newRequest = new NextRequest(request.url, {
      headers: new Headers({
        ...Object.fromEntries(request.headers),
        authorization: `Bearer ${cronSecret}`,
      }),
    });

    return GET(newRequest);
  } catch (error) {
    console.error("Manual sync error:", error);
    return NextResponse.json(
      { error: "Manual sync failed" },
      { status: 500 }
    );
  }
}
