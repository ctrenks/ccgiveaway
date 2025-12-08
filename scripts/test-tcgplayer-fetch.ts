/**
 * Test script to see what data is available from TCGPlayer
 * Run with: npx tsx scripts/test-tcgplayer-fetch.ts <url>
 */

const url = process.argv[2] || "https://www.tcgplayer.com/product/215342/magic-core-set-2021-grim-tutor-alternate-art";

console.log("Testing TCGPlayer data extraction for:", url);
console.log("=".repeat(80));

async function testFetch() {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch:", response.status);
      return;
    }

    const html = await response.text();
    console.log(`\n✓ Fetched HTML (${html.length} bytes)\n`);

    // Look for JSON data
    console.log("Searching for embedded JSON data...\n");

    // Check for script tags with JSON
    const scriptMatches = html.match(/<script[^>]*>([\s\S]*?)<\/script>/gi);
    if (scriptMatches) {
      console.log(`Found ${scriptMatches.length} script tags`);

      for (let i = 0; i < scriptMatches.length; i++) {
        const script = scriptMatches[i];

        // Look for JSON-LD
        if (script.includes('application/ld+json')) {
          console.log(`\n[Script ${i}] JSON-LD found:`);
          const jsonMatch = script.match(/>([\s\S]*?)<\/script>/);
          if (jsonMatch) {
            try {
              const data = JSON.parse(jsonMatch[1]);
              console.log(JSON.stringify(data, null, 2));
            } catch (e) {
              console.log("Failed to parse");
            }
          }
        }

        // Look for __NEXT_DATA__ or other embedded data
        if (script.includes('__NEXT_DATA__') || script.includes('window.__APOLLO_STATE__') || script.includes('window.__INITIAL_STATE__')) {
          console.log(`\n[Script ${i}] Found embedded data object`);
          const snippet = script.substring(0, 500);
          console.log(snippet + "...");
        }
      }
    }

    // Look for specific patterns
    console.log("\n" + "=".repeat(80));
    console.log("Pattern Search Results:");
    console.log("=".repeat(80));

    const searches = [
      { name: "Mana Cost", pattern: /mana[Cc]ost.*?[:=]\s*["{]([^"}<]+)["}]/i },
      { name: "Card Number", pattern: /number.*?[:=]\s*["{]([^"}<]+)["}]/i },
      { name: "Legality", pattern: /legal[ity]*.*?[:=]\s*["{]([^"}<]+)["}]/i },
      { name: "Card Type", pattern: /type.*?[:=]\s*["{]([^"}<]+)["}]/i },
      { name: "Power/Toughness", pattern: /power.*?[:=]\s*["{]([^"}<]+)["}]/i },
      { name: "Artist", pattern: /artist.*?[:=]\s*["{]([^"}<]+)["}]/i },
      { name: "Rarity", pattern: /rarity.*?[:=]\s*["{]([^"}<]+)["}]/i },
      { name: "Format Legal", pattern: /(Standard|Modern|Commander|Pioneer|Legacy|Vintage)/gi },
    ];

    for (const search of searches) {
      const match = html.match(search.pattern);
      if (match) {
        console.log(`\n✓ ${search.name}:`, match[1] || match[0]);
      } else {
        console.log(`\n✗ ${search.name}: Not found`);
      }
    }

    // Check for specific HTML structures
    console.log("\n" + "=".repeat(80));
    console.log("HTML Structure Check:");
    console.log("=".repeat(80));

    const structures = [
      { name: "Details section", pattern: /details|specifications|card-details/i },
      { name: "Stats section", pattern: /stats|attributes|card-stats/i },
      { name: "Legality section", pattern: /legality|formats|legal-in/i },
      { name: "Vue/React data", pattern: /data-v-|data-reactid|__vue__/i },
    ];

    for (const structure of structures) {
      const found = structure.pattern.test(html);
      console.log(`${found ? '✓' : '✗'} ${structure.name}: ${found ? 'Found' : 'Not found'}`);
    }

  } catch (error) {
    console.error("Error:", error);
  }
}

testFetch();
