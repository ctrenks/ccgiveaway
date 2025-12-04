// TCGPlayer scraper for importing card data using Scrapfly

export interface TCGPlayerProduct {
  productId: string;
  name: string;
  setName: string;
  cardNumber?: string;
  game: string;
  rarity?: string;
  imageUrl?: string;
  marketPrice?: number;
  listedPrice?: number;
  url: string;
}

export interface ImportSettings {
  discountType: "percentage" | "fixed";
  discountValue: number;
}

/**
 * Parse TCGPlayer URL to extract product info
 */
export function parseTCGPlayerUrl(url: string): { productId: string; game: string; slug: string } | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);

    if (pathParts[0] !== "product" || pathParts.length < 3) {
      return null;
    }

    const productId = pathParts[1];
    const fullSlug = pathParts[2];
    const slugParts = fullSlug.split("-");
    const game = slugParts[0];

    return { productId, game, slug: fullSlug };
  } catch {
    return null;
  }
}

/**
 * Fetch page using Scrapfly API (renders JavaScript)
 */
async function fetchWithScrapfly(url: string): Promise<string | null> {
  const apiKey = process.env.SCRAPFLY_API_KEY;

  if (!apiKey) {
    console.error("SCRAPFLY_API_KEY not set");
    return null;
  }

  try {
    const scrapflyUrl = new URL("https://api.scrapfly.io/scrape");
    scrapflyUrl.searchParams.set("key", apiKey);
    scrapflyUrl.searchParams.set("url", url);
    scrapflyUrl.searchParams.set("render_js", "true");
    scrapflyUrl.searchParams.set("asp", "true"); // Anti-scraping protection bypass
    scrapflyUrl.searchParams.set("country", "us");
    scrapflyUrl.searchParams.set("rendering_wait", "1000"); // Wait 1s for JS to load prices
    scrapflyUrl.searchParams.set("wait_for_selector", ".price-points__upper__price"); // Wait for price element

    console.log("Fetching via Scrapfly:", url);

    const response = await fetch(scrapflyUrl.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Scrapfly error:", response.status, errorText);
      return null;
    }

    const data = await response.json();

    if (data.result?.content) {
      const html = data.result.content;
      console.log("Scrapfly returned HTML, length:", html.length);

      // Debug: Search for dollar amounts in the response
      const dollarMatches = html.match(/\$[\d,]+\.?\d*/g);
      if (dollarMatches) {
        console.log("Dollar amounts found in HTML:", dollarMatches.slice(0, 10));
      }

      // Debug: Look for price-related content
      const priceSection = html.match(/.{0,100}price-points.{0,200}/i);
      if (priceSection) {
        console.log("Price section found:", priceSection[0]);
      }

      return html;
    }

    console.error("No content in Scrapfly response");
    return null;
  } catch (error) {
    console.error("Scrapfly request failed:", error);
    return null;
  }
}

/**
 * Fallback: Fetch page directly (may not get JS-rendered content)
 */
async function fetchDirect(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Direct fetch failed:", response.status);
      return null;
    }

    return await response.text();
  } catch (error) {
    console.error("Direct fetch error:", error);
    return null;
  }
}

/**
 * Extract price from HTML
 */
function extractPriceFromHTML(html: string): number {
  // First, try to find the market price in the specific TCGPlayer price section
  // Look for the price-points section which contains the market price
  const pricePointsMatch = html.match(/price-points__upper__price[^>]*>([^<]+)</i);
  if (pricePointsMatch) {
    const priceText = pricePointsMatch[1];
    const priceMatch = priceText.match(/\$([\d,]+\.?\d*)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ""));
      if (price > 0) {
        console.log("Found market price in price-points:", price);
        return price;
      }
    }
  }

  // Find dollar amounts with proper price format: $XX.XX (must have cents)
  const allPrices = html.match(/\$\d{1,4}(?:,\d{3})*\.\d{2}/g);
  
  if (allPrices && allPrices.length > 0) {
    console.log("All prices found:", allPrices.slice(0, 20));
    
    // Parse all prices and filter card prices ($5 - $10000)
    // Skip prices under $5 (likely shipping, fees, etc.)
    const cardPrices: number[] = [];
    for (const priceStr of allPrices) {
      const price = parseFloat(priceStr.replace(/[$,]/g, ""));
      if (price >= 5 && price < 10000) {
        cardPrices.push(price);
      }
    }
    
    console.log("Card prices (>=$5):", cardPrices.slice(0, 15));
    
    if (cardPrices.length > 0) {
      // Count occurrences of each price
      const priceCounts = new Map<number, number>();
      for (const price of cardPrices) {
        const rounded = Math.round(price * 100) / 100;
        priceCounts.set(rounded, (priceCounts.get(rounded) || 0) + 1);
      }
      
      // Find most common price among card prices
      let mostCommonPrice = cardPrices[0];
      let maxCount = 1;
      for (const [price, count] of priceCounts.entries()) {
        if (count > maxCount) {
          maxCount = count;
          mostCommonPrice = price;
        }
      }
      
      if (maxCount > 1) {
        console.log("Using most common card price:", mostCommonPrice, "appears", maxCount, "times");
        return mostCommonPrice;
      }
      
      // Use first card price
      console.log("Using first card price:", cardPrices[0]);
      return cardPrices[0];
    }
  }

  // Fallback: Try JSON patterns in script tags
  const patterns = [
    /"marketPrice"\s*:\s*([\d.]+)/i,
    /"lowPrice"\s*:\s*([\d.]+)/i,
    /"price"\s*:\s*([\d.]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1]);
      if (price >= 5) {
        console.log("Found price via JSON pattern:", price);
        return price;
      }
    }
  }

  console.log("No price found in HTML");
  return 0;
}

/**
 * Fetch product data from TCGPlayer using Scrapfly
 */
export async function fetchTCGPlayerProduct(url: string): Promise<TCGPlayerProduct | null> {
  try {
    const parsed = parseTCGPlayerUrl(url);
    if (!parsed) {
      throw new Error("Invalid TCGPlayer URL");
    }

    console.log("Fetching TCGPlayer product:", parsed.productId);

    // Try Scrapfly first (renders JavaScript, gets real prices)
    let html = await fetchWithScrapfly(url);

    // Fallback to direct fetch if Scrapfly fails
    if (!html) {
      console.log("Scrapfly failed, trying direct fetch...");
      html = await fetchDirect(url);
    }

    if (!html) {
      throw new Error("Failed to fetch page content");
    }

    console.log("HTML length:", html.length);

    // Extract price from rendered HTML
    const marketPrice = extractPriceFromHTML(html);
    console.log("Price from HTML:", marketPrice);

    // Extract other data from HTML
    const name = extractName(html, parsed.slug);
    const imageUrl = extractImage(html);
    const setName = extractSetName(html, parsed.slug);

    console.log("Extracted:", { name, imageUrl: imageUrl?.substring(0, 50), setName, marketPrice });

    const product: TCGPlayerProduct = {
      productId: parsed.productId,
      url,
      game: parsed.game,
      name,
      setName,
      cardNumber: extractCardNumber(html),
      rarity: extractRarity(html),
      imageUrl,
      marketPrice,
      listedPrice: marketPrice,
    };

    return product;
  } catch (error) {
    console.error("TCGPlayer fetch error:", error);
    return null;
  }
}

function extractName(html: string, slug: string): string {
  // Try multiple patterns for og:title
  const patterns = [
    /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+property=["']og:title["']/i,
    /<meta\s+name=["']og:title["']\s+content=["']([^"']+)["']/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let name = match[1];
      // Clean up
      name = name.split(" | ")[0].split(" - TCG")[0].split(" - Price")[0].trim();
      if (name && name.length > 2) return name;
    }
  }

  return formatSlugAsName(slug);
}

function extractImage(html: string): string | undefined {
  const patterns = [
    /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i,
    /<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i,
    /<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i,
    /<meta\s+property=["']twitter:image["']\s+content=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1] && match[1].startsWith("http")) {
      console.log("Found image:", match[1]);
      return match[1];
    }
  }

  // Try to find image in JSON data
  const jsonMatch = html.match(/"image"\s*:\s*"(https?:\/\/[^"]+)"/i);
  if (jsonMatch) {
    console.log("Found image in JSON:", jsonMatch[1]);
    return jsonMatch[1];
  }

  return undefined;
}

function extractSetName(html: string, slug: string): string {
  const patterns = [
    /"setName"\s*:\s*"([^"]+)"/i,
    /"set"\s*:\s*"([^"]+)"/i,
    /data-set=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return formatSlugAsSet(slug);
}

function extractCardNumber(html: string): string | undefined {
  const match = html.match(/#?\s*(\d{1,4}\s*\/\s*\d{1,4})/);
  if (match) return match[1].replace(/\s/g, "");
  return undefined;
}

function extractRarity(html: string): string | undefined {
  const rarities = [
    "Mythic Rare", "Secret Rare", "Ultra Rare", "Illustration Rare",
    "Special Art Rare", "Holo Rare", "Rare", "Uncommon", "Common"
  ];

  const lowerHtml = html.toLowerCase();
  for (const rarity of rarities) {
    if (lowerHtml.includes(rarity.toLowerCase())) {
      return rarity;
    }
  }
  return undefined;
}

function formatSlugAsName(slug: string): string {
  const parts = slug.split("-");
  const nameParts = parts.slice(Math.max(1, parts.length - 4));
  return nameParts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function formatSlugAsSet(slug: string): string {
  const parts = slug.split("-");
  if (parts.length < 3) return "";
  const setParts = parts.slice(1, Math.max(2, parts.length - 3));
  return setParts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function calculateDiscountedPrice(
  originalPrice: number,
  settings: ImportSettings
): number {
  if (settings.discountType === "percentage") {
    return originalPrice * (1 - settings.discountValue / 100);
  } else {
    return Math.max(0, originalPrice - settings.discountValue);
  }
}

export function mapGameToSubType(game: string): string {
  const mapping: Record<string, string> = {
    magic: "Magic The Gathering",
    pokemon: "Pokemon",
    yugioh: "Yu-Gi-Oh!",
    "one-piece": "One Piece",
    "dragon-ball-super": "Dragon Ball Super",
    lorcana: "Disney Lorcana",
    "flesh-and-blood": "Flesh and Blood",
    "star-wars": "Star Wars Unlimited",
  };
  return mapping[game.toLowerCase()] || game.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}
