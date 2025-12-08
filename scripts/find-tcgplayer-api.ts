/**
 * Test script to find TCGPlayer API endpoints
 * Run with: npx tsx scripts/find-tcgplayer-api.ts
 */

const productId = "215342"; // Grim Tutor
const url = `https://www.tcgplayer.com/product/${productId}/magic-core-set-2021-grim-tutor-alternate-art`;

console.log("Searching for TCGPlayer API endpoints...\n");

async function testAPIs() {
  // TCGPlayer often uses these API patterns
  const apiEndpoints = [
    `https://mpapi.tcgplayer.com/v2/product/${productId}/details`,
    `https://mpapi.tcgplayer.com/v2/product/${productId}`,
    `https://mp-search-api.tcgplayer.com/v1/product/${productId}/details`,
    `https://mp-search-api.tcgplayer.com/v1/product/${productId}`,
    `https://infinite-api.tcgplayer.com/product/${productId}`,
    `https://api.tcgplayer.com/v1/catalog/products/${productId}`,
    `https://api.tcgplayer.com/catalog/products/${productId}`,
    `https://tcgplayer.com/api/product/${productId}`,
  ];

  for (const endpoint of apiEndpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          "Accept": "application/json",
          "Referer": url,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✓ SUCCESS! ${endpoint}`);
        console.log("Response:");
        console.log(JSON.stringify(data, null, 2));
        console.log("\n" + "=".repeat(80) + "\n");
      } else {
        console.log(`  Status: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`  Error: ${error instanceof Error ? error.message : 'Unknown'}`);
    }
  }

  console.log("\nTrying Scryfall (Magic cards have alternative sources)...");

  // Scryfall is a popular Magic card API
  try {
    const scryfallSearch = await fetch(`https://api.scryfall.com/cards/search?q=!"Grim Tutor" set:m21`, {
      headers: {
        "Accept": "application/json",
      },
    });

    if (scryfallSearch.ok) {
      const data = await scryfallSearch.json();
      console.log("✓ Scryfall API works!");
      if (data.data && data.data[0]) {
        const card = data.data[0];
        console.log("\nScryfall has this data:");
        console.log(`  Name: ${card.name}`);
        console.log(`  Mana Cost: ${card.mana_cost}`);
        console.log(`  Type: ${card.type_line}`);
        console.log(`  Set: ${card.set_name}`);
        console.log(`  Collector Number: ${card.collector_number}`);
        console.log(`  Artist: ${card.artist}`);
        console.log(`  Legalities:`, JSON.stringify(card.legalities, null, 2));
        console.log("\n💡 We could use Scryfall as a fallback for Magic cards!");
      }
    }
  } catch (error) {
    console.log(`Error with Scryfall: ${error instanceof Error ? error.message : 'Unknown'}`);
  }
}

testAPIs();
