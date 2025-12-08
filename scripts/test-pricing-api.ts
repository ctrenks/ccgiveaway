/**
 * Test TCGPlayer pricing endpoints
 */

const productId = "215342"; // Grim Tutor

async function testPricing() {
  const endpoints = [
    `https://mpapi.tcgplayer.com/v2/product/${productId}/latestsales`,
    `https://mpapi.tcgplayer.com/v2/product/${productId}/prices`,
    `https://mpapi.tcgplayer.com/v2/pricing/product/${productId}`,
    `https://mp-search-api.tcgplayer.com/v1/product/${productId}/pricing`,
    `https://mp-search-api.tcgplayer.com/v1/product/${productId}/price`,
    `https://infinite-api.tcgplayer.com/price/product/${productId}`,
    `https://tcgplayer.com/product/${productId}/price`,
  ];

  console.log("Testing pricing endpoints for product:", productId);
  console.log("=".repeat(80) + "\n");

  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await fetch(endpoint, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`✓ SUCCESS!`);
        console.log(JSON.stringify(data, null, 2));
        console.log("\n" + "=".repeat(80) + "\n");
      } else {
        console.log(`  Status: ${response.status}\n`);
      }
    } catch (error) {
      console.log(`  Error: ${error}\n`);
    }
  }
}

testPricing();

