// TCGPlayer scraper for importing card data
// Extracts product info from TCGPlayer product pages

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
  discountValue: number; // 10 = 10% off or $10 off
}

const DEFAULT_SETTINGS: ImportSettings = {
  discountType: "percentage",
  discountValue: 10, // 10% off by default
};

/**
 * Parse TCGPlayer URL to extract product info
 * URL format: https://www.tcgplayer.com/product/{productId}/{game}-{set}-{cardname}
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

    // Extract game from slug (first part before the set name)
    const slugParts = fullSlug.split("-");
    const game = slugParts[0]; // magic, pokemon, yugioh, etc.

    return { productId, game, slug: fullSlug };
  } catch {
    return null;
  }
}

/**
 * Fetch product data from TCGPlayer
 * Uses their product page and extracts data from meta tags and structured data
 */
export async function fetchTCGPlayerProduct(url: string): Promise<TCGPlayerProduct | null> {
  try {
    const parsed = parseTCGPlayerUrl(url);
    if (!parsed) {
      throw new Error("Invalid TCGPlayer URL");
    }

    // Fetch the product page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 0 }, // Don't cache
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Debug: Log a portion of the HTML to see what we're getting
    console.log("TCGPlayer HTML length:", html.length);

    // Extract data from meta tags and page content
    const product: TCGPlayerProduct = {
      productId: parsed.productId,
      url,
      game: parsed.game,
      name: extractProductName(html) || extractFromSlug(parsed.slug, "name"),
      setName: extractSetName(html) || extractFromSlug(parsed.slug, "set"),
      cardNumber: extractCardNumber(html),
      rarity: extractRarity(html),
      imageUrl: extractMetaContent(html, "og:image"),
      marketPrice: extractPrice(html),
      listedPrice: extractPrice(html),
    };

    // Clean up the name (remove set name suffix if present)
    if (product.name && product.name.includes(" - ")) {
      product.name = product.name.split(" - ")[0].trim();
    }

    // Remove " | TCGplayer" from name if present
    if (product.name && product.name.includes(" | ")) {
      product.name = product.name.split(" | ")[0].trim();
    }

    console.log("Extracted product:", product);

    return product;
  } catch (error) {
    console.error("TCGPlayer fetch error:", error);
    return null;
  }
}

/**
 * Calculate our price with discount applied
 */
export function calculateDiscountedPrice(
  originalPrice: number,
  settings: ImportSettings = DEFAULT_SETTINGS
): number {
  if (settings.discountType === "percentage") {
    return originalPrice * (1 - settings.discountValue / 100);
  } else {
    return Math.max(0, originalPrice - settings.discountValue);
  }
}

// Helper functions to extract data from HTML
function extractMetaContent(html: string, property: string): string | undefined {
  // Try property attribute
  const regex1 = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const match1 = html.match(regex1);
  if (match1) return match1[1];

  // Try content before property
  const regex2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, "i");
  const match2 = html.match(regex2);
  if (match2) return match2[1];

  // Try name attribute (for og: tags sometimes)
  const regex3 = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const match3 = html.match(regex3);
  if (match3) return match3[1];

  return undefined;
}

function extractProductName(html: string): string | undefined {
  // Try og:title first
  const ogTitle = extractMetaContent(html, "og:title");
  if (ogTitle) return ogTitle;

  // Try title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();

  // Try h1 tag
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();

  return undefined;
}

function extractSetName(html: string): string | undefined {
  // Look for set name in JSON-LD structured data
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const script of jsonLdMatch) {
      const jsonContent = script.replace(/<\/?script[^>]*>/gi, "");
      try {
        const data = JSON.parse(jsonContent);
        if (data.name && data.category) {
          return data.category;
        }
      } catch {
        // Continue to next script
      }
    }
  }

  // Look for set name in specific patterns
  const setMatch = html.match(/"setName"\s*:\s*"([^"]+)"/i);
  if (setMatch) return setMatch[1];

  // Look for expansion/set in the page
  const expansionMatch = html.match(/expansion["\s:]+([^"<,]+)/i);
  if (expansionMatch) return expansionMatch[1].trim();

  return undefined;
}

function extractCardNumber(html: string): string | undefined {
  // Look for card number pattern like "#102/165" or "102/165"
  const numberMatch = html.match(/#?\s*(\d+\s*\/\s*\d+)/);
  if (numberMatch) return numberMatch[1].replace(/\s/g, "");

  // Look for collector number
  const collectorMatch = html.match(/collector\s*number[:\s]+([^\s<]+)/i);
  if (collectorMatch) return collectorMatch[1];

  return undefined;
}

function extractRarity(html: string): string | undefined {
  // Common rarities in order of precedence
  const rarities = [
    "Mythic Rare", "Secret Rare", "Ultra Rare", "Illustration Rare",
    "Special Art Rare", "Holo Rare", "Rare Holo", "Rare",
    "Uncommon", "Common"
  ];

  const lowerHtml = html.toLowerCase();
  for (const rarity of rarities) {
    if (lowerHtml.includes(rarity.toLowerCase())) {
      return rarity;
    }
  }
  return undefined;
}

function extractPrice(html: string): number | undefined {
  // Try multiple price extraction methods

  // Method 1: Look for JSON-LD Product schema
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const script of jsonLdMatch) {
      const jsonContent = script.replace(/<\/?script[^>]*>/gi, "");
      try {
        const data = JSON.parse(jsonContent);
        // Check for Product schema
        if (data["@type"] === "Product" && data.offers) {
          const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
          if (offers.price) {
            const price = parseFloat(offers.price);
            if (!isNaN(price) && price > 0) {
              console.log("Found price in JSON-LD:", price);
              return price;
            }
          }
          if (offers.lowPrice) {
            const price = parseFloat(offers.lowPrice);
            if (!isNaN(price) && price > 0) {
              console.log("Found lowPrice in JSON-LD:", price);
              return price;
            }
          }
        }
      } catch {
        // Continue to next script
      }
    }
  }

  // Method 2: Look for market price patterns
  const marketPricePatterns = [
    /market\s*price[:\s]*\$?([\d,]+\.?\d*)/i,
    /marketPrice["\s:]+\$?([\d,]+\.?\d*)/i,
    /"market"[:\s]+"?\$?([\d,]+\.?\d*)"?/i,
  ];

  for (const pattern of marketPricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(",", ""));
      if (!isNaN(price) && price > 0) {
        console.log("Found market price:", price);
        return price;
      }
    }
  }

  // Method 3: Look for price in data attributes or specific elements
  const pricePatterns = [
    /data-price=["']?\$?([\d,]+\.?\d*)["']?/i,
    /price["\s:]+\$?([\d,]+\.?\d*)/i,
    /"price":\s*"?\$?([\d,]+\.?\d*)"?/i,
    /class="price[^"]*"[^>]*>\$?([\d,]+\.?\d*)/i,
    />\s*\$\s*([\d,]+\.?\d*)\s*</,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const price = parseFloat(match[1].replace(",", ""));
      if (!isNaN(price) && price > 0 && price < 100000) { // Sanity check
        console.log("Found price with pattern:", price);
        return price;
      }
    }
  }

  // Method 4: Look for og:price meta tags
  const ogPrice = extractMetaContent(html, "og:price:amount") ||
                  extractMetaContent(html, "product:price:amount");
  if (ogPrice) {
    const price = parseFloat(ogPrice.replace(",", ""));
    if (!isNaN(price) && price > 0) {
      console.log("Found og:price:", price);
      return price;
    }
  }

  console.log("No price found in HTML");
  return undefined;
}

function extractFromSlug(slug: string, type: "name" | "set"): string {
  const parts = slug.split("-");

  if (type === "set" && parts.length >= 3) {
    // Set name is typically after the game name and before the card name
    // e.g., "magic-modern-horizons-3-card-name" -> "modern horizons 3"
    // Find where numbers appear (usually set number)
    let setEndIndex = parts.length - 1;
    for (let i = parts.length - 1; i >= 1; i--) {
      if (/^\d+$/.test(parts[i])) {
        setEndIndex = i + 1;
        break;
      }
    }
    return parts.slice(1, Math.min(setEndIndex, parts.length - 1))
      .join(" ")
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  if (type === "name") {
    // Card name is typically the last parts after the set
    // Take last 2-4 parts depending on length
    const namePartsCount = Math.min(4, Math.max(2, Math.floor(parts.length / 2)));
    return parts.slice(-namePartsCount)
      .join(" ")
      .replace(/\b\w/g, c => c.toUpperCase());
  }

  return slug;
}

/**
 * Map game name to our SubType
 */
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
