// Test Scrapfly directly to see what's being returned
// Run: node scripts/test-scrapfly.js

const fs = require("fs");

const SCRAPFLY_API_KEY = process.env.SCRAPFLY_API_KEY;
const TEST_URL =
  "https://www.tcgplayer.com/product/238607/magic-modern-horizons-2-arid-mesa?page=1&Language=English";

async function testScrapfly() {
  if (!SCRAPFLY_API_KEY) {
    console.error("❌ SCRAPFLY_API_KEY not set in environment");
    console.log("Set it with: export SCRAPFLY_API_KEY=your_key_here");
    process.exit(1);
  }

  console.log("🔄 Testing Scrapfly with TCGPlayer URL...");
  console.log("URL:", TEST_URL);
  console.log("");

  const scrapflyUrl = new URL("https://api.scrapfly.io/scrape");
  scrapflyUrl.searchParams.set("key", SCRAPFLY_API_KEY);
  scrapflyUrl.searchParams.set("url", TEST_URL);
  scrapflyUrl.searchParams.set("render_js", "true");
  scrapflyUrl.searchParams.set("asp", "true");
  scrapflyUrl.searchParams.set("country", "us");
  scrapflyUrl.searchParams.set("rendering_wait", "10000"); // 10 seconds
  scrapflyUrl.searchParams.set("auto_scroll", "true");

  console.log("⏱️  Fetching (will take ~10+ seconds)...\n");

  try {
    const response = await fetch(scrapflyUrl.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      console.error("❌ Scrapfly HTTP error:", response.status);
      const errorText = await response.text();
      console.error("Error body:", errorText);
      process.exit(1);
    }

    const data = await response.json();

    // Save full response to file
    fs.writeFileSync("scrapfly-response.json", JSON.stringify(data, null, 2));
    console.log("✅ Full response saved to: scrapfly-response.json\n");

    // Save HTML to file
    if (data.result?.content) {
      fs.writeFileSync("scrapfly-page.html", data.result.content);
      console.log("✅ HTML saved to: scrapfly-page.html");
      console.log("   HTML length:", data.result.content.length, "bytes\n");

      // Check for prices in HTML
      const html = data.result.content;
      const dollarMatches = html.match(/\$[\d,]+\.?\d*/g);
      if (dollarMatches && dollarMatches.length > 0) {
        console.log("💰 Dollar amounts found in HTML:");
        console.log("   ", dollarMatches.slice(0, 15).join(", "));
        console.log("");
      } else {
        console.log("⚠️  NO dollar amounts found in HTML\n");
      }

      // Check for key indicators
      if (html.includes("near-mint-table")) {
        console.log("✅ Found 'near-mint-table' in HTML");
      } else {
        console.log("❌ No 'near-mint-table' found");
      }

      if (html.includes("price-points__upper__price")) {
        console.log("✅ Found 'price-points__upper__price' in HTML");
      } else {
        console.log("❌ No 'price-points__upper__price' found");
      }

      if (html.includes("hostInit") && html.length < 50000) {
        console.log("⚠️  Vue shell only - JavaScript didn't render properly");
      }
    } else {
      console.log("❌ No HTML content in response");
    }

    // Show cost
    if (data.context?.cost) {
      console.log("\n💵 Scrapfly cost:", data.context.cost.total, "credits");
    }

    console.log(
      "\n✅ Done! Check scrapfly-response.json and scrapfly-page.html"
    );
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

testScrapfly();
