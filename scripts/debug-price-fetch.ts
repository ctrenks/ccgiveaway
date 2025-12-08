import { fetchTCGPlayerProductWithPrices } from "../src/lib/tcgplayer";

// Test the price fetching with detailed logging
async function testPriceFetch() {
  const testUrl = process.argv[2];
  
  if (!testUrl) {
    console.log("Usage: npx tsx scripts/debug-price-fetch.ts <TCGPlayer URL>");
    console.log("Example: npx tsx scripts/debug-price-fetch.ts https://www.tcgplayer.com/product/550652/magic-core-set-2021-grim-tutor");
    process.exit(1);
  }

  console.log("=".repeat(80));
  console.log("Testing price fetch for:", testUrl);
  console.log("=".repeat(80));
  console.log();

  const result = await fetchTCGPlayerProductWithPrices(testUrl);

  console.log();
  console.log("=".repeat(80));
  console.log("RESULT:");
  console.log("=".repeat(80));
  console.log(JSON.stringify(result, null, 2));
}

testPriceFetch().catch(console.error);

