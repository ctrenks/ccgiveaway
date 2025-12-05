/**
 * Script to update existing cards with improved name extraction and cardType
 * Run with: npx tsx scripts/update-card-data.ts
 */

import { PrismaClient } from "@prisma/client";
import { fetchTCGPlayerProduct } from "../src/lib/tcgplayer";

const prisma = new PrismaClient();

async function updateCardData() {
  console.log("Starting card data update...\n");

  try {
    // Get all products that have a TCGPlayer URL
    const allProducts = await prisma.product.findMany({
      where: {
        tcgPlayerUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        tcgPlayerUrl: true,
        cardType: true,
        description: true,
      },
    });

    // Filter for names less than 25 characters OR missing cardType
    const products = allProducts.filter(
      (p) => p.name.length < 25 || !p.cardType
    );

    console.log(`Found ${allProducts.length} total products with TCGPlayer URLs`);
    console.log(`Filtered to ${products.length} products that need updating:`);
    console.log(`  - ${allProducts.filter(p => p.name.length < 25).length} with name < 25 characters`);
    console.log(`  - ${allProducts.filter(p => !p.cardType).length} missing cardType\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`[${i + 1}/${products.length}] Processing: ${product.name} (${product.name.length} chars)`);

      if (!product.tcgPlayerUrl) {
        console.log("  ⚠️  No URL, skipping\n");
        skipped++;
        continue;
      }

      try {
        // Fetch updated data from TCGPlayer
        console.log(`  🔍 Fetching from TCGPlayer...`);
        const tcgData = await fetchTCGPlayerProduct(product.tcgPlayerUrl);

        if (!tcgData) {
          console.log("  ❌ Failed to fetch data\n");
          failed++;
          continue;
        }

        // Prepare update data
        const updateData: any = {};
        let hasUpdates = false;

        // Check if name changed (improved extraction)
        if (tcgData.name && tcgData.name !== product.name) {
          updateData.name = tcgData.name;
          hasUpdates = true;
          console.log(`  📝 Name: "${product.name}" → "${tcgData.name}"`);
        }

        // Check if cardType is missing or different
        if (tcgData.cardType && tcgData.cardType !== product.cardType) {
          updateData.cardType = tcgData.cardType;
          hasUpdates = true;
          console.log(`  🃏 Card Type: "${product.cardType || 'null'}" → "${tcgData.cardType}"`);
        }

        // Check if description is missing
        if (tcgData.description && !product.description) {
          updateData.description = tcgData.description;
          hasUpdates = true;
          console.log(`  📄 Description: Added (${tcgData.description.substring(0, 50)}...)`);
        }

        // Update if there are changes
        if (hasUpdates) {
          await prisma.product.update({
            where: { id: product.id },
            data: updateData,
          });
          console.log("  ✅ Updated\n");
          updated++;
        } else {
          console.log("  ⏭️  No changes needed\n");
          skipped++;
        }

        // Rate limiting - wait 2 seconds between requests
        if (i < products.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}\n`);
        failed++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log("Update complete!");
    console.log("=".repeat(50));
    console.log(`✅ Updated: ${updated}`);
    console.log(`⏭️  Skipped: ${skipped}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📊 Total processed: ${products.length}`);
    console.log(`📊 Total in database: ${allProducts.length}`);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateCardData();

