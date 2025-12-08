/**
 * Script to update existing cards with all data fields (no pricing)
 * Run with: npx tsx scripts/update-card-data.ts
 * 
 * Updates: name, cardNumber, cardType, description, legality, artist, manaCost, powerToughness
 */

import { PrismaClient } from "@prisma/client";
import { fetchTCGPlayerProductData } from "../src/lib/tcgplayer";

const prisma = new PrismaClient();

async function updateCardData() {
  console.log("Starting card data update (all fields except pricing)...\n");

  try {
    // Get all products that have a TCGPlayer URL
    const products = await prisma.product.findMany({
      where: {
        tcgPlayerUrl: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        tcgPlayerUrl: true,
        cardNumber: true,
        cardType: true,
        description: true,
        legality: true,
        artist: true,
        manaCost: true,
        powerToughness: true,
      },
    });

    console.log(`Found ${products.length} total products with TCGPlayer URLs`);
    console.log(`Will update all data fields (name, cardNumber, cardType, description, legality, artist, manaCost, powerToughness)\n`);

    let updated = 0;
    let skipped = 0;
    let failed = 0;

    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`[${i + 1}/${products.length}] Processing: ${product.name}`);

      if (!product.tcgPlayerUrl) {
        console.log("  ⚠️  No URL, skipping\n");
        skipped++;
        continue;
      }

      try {
        // Fetch updated data from TCGPlayer (direct fetch, no Scrapfly)
        console.log(`  🔍 Fetching from TCGPlayer (direct)...`);
        const tcgData = await fetchTCGPlayerProductData(product.tcgPlayerUrl);

        if (!tcgData) {
          console.log("  ❌ Failed to fetch data\n");
          failed++;
          continue;
        }

        // Prepare update data
        const updateData: any = {};
        let hasUpdates = false;
        const changes: string[] = [];

        // Check if name changed (improved extraction)
        if (tcgData.name && tcgData.name !== product.name) {
          updateData.name = tcgData.name;
          hasUpdates = true;
          changes.push(`📝 Name: "${product.name}" → "${tcgData.name}"`);
        }

        // Check if cardNumber changed or is missing
        if (tcgData.cardNumber && tcgData.cardNumber !== product.cardNumber) {
          updateData.cardNumber = tcgData.cardNumber;
          hasUpdates = true;
          changes.push(`#️⃣ Card Number: "${product.cardNumber || 'null'}" → "${tcgData.cardNumber}"`);
        }

        // Check if cardType changed or is missing
        if (tcgData.cardType && tcgData.cardType !== product.cardType) {
          updateData.cardType = tcgData.cardType;
          hasUpdates = true;
          changes.push(`🃏 Card Type: "${product.cardType || 'null'}" → "${tcgData.cardType}"`);
        }

        // Check if description is missing or different
        if (tcgData.description && tcgData.description !== product.description) {
          updateData.description = tcgData.description;
          hasUpdates = true;
          changes.push(`📄 Description: ${product.description ? 'Updated' : 'Added'} (${tcgData.description.substring(0, 40)}...)`);
        }

        // Check if legality is missing or different
        if (tcgData.legality && tcgData.legality !== product.legality) {
          updateData.legality = tcgData.legality;
          hasUpdates = true;
          changes.push(`⚖️ Legality: "${product.legality || 'null'}" → "${tcgData.legality}"`);
        }

        // Check if artist is missing or different
        if (tcgData.artist && tcgData.artist !== product.artist) {
          updateData.artist = tcgData.artist;
          hasUpdates = true;
          changes.push(`🎨 Artist: "${product.artist || 'null'}" → "${tcgData.artist}"`);
        }

        // Check if manaCost is missing or different
        if (tcgData.manaCost && tcgData.manaCost !== product.manaCost) {
          updateData.manaCost = tcgData.manaCost;
          hasUpdates = true;
          changes.push(`💎 Mana Cost: "${product.manaCost || 'null'}" → "${tcgData.manaCost}"`);
        }

        // Check if powerToughness is missing or different
        if (tcgData.powerToughness && tcgData.powerToughness !== product.powerToughness) {
          updateData.powerToughness = tcgData.powerToughness;
          hasUpdates = true;
          changes.push(`💪 P/T: "${product.powerToughness || 'null'}" → "${tcgData.powerToughness}"`);
        }

        // Update if there are changes
        if (hasUpdates) {
          await prisma.product.update({
            where: { id: product.id },
            data: updateData,
          });
          changes.forEach(change => console.log(`  ${change}`));
          console.log("  ✅ Updated\n");
          updated++;
        } else {
          console.log("  ⏭️  No changes needed\n");
          skipped++;
        }

        // Rate limiting - wait 1.5 seconds between requests (direct fetch is faster)
        if (i < products.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error instanceof Error ? error.message : "Unknown error"}\n`);
        failed++;
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("Card Data Update Complete!");
    console.log("=".repeat(60));
    console.log(`✅ Updated: ${updated} cards`);
    console.log(`⏭️  Skipped (no changes): ${skipped} cards`);
    console.log(`❌ Failed: ${failed} cards`);
    console.log(`📊 Total processed: ${products.length} cards`);
    console.log("\nFields updated: name, cardNumber, cardType, description,");
    console.log("                legality, artist, manaCost, powerToughness");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateCardData();

