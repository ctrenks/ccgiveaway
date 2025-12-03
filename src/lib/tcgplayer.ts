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
 * Fetch price from TCGPlayer's internal API
 */
async function fetchTCGPlayerPrice(productId: string): Promise<{ marketPrice?: number; lowPrice?: number } | null> {
  try {
    // TCGPlayer's internal price API endpoint
    const priceUrl = `https://mp-search-api.tcgplayer.com/v1/product/${productId}/pricepoints`;
    
    const response = await fetch(priceUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
        "Origin": "https://www.tcgplayer.com",
        "Referer": "https://www.tcgplayer.com/",
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("TCGPlayer price API response:", JSON.stringify(data).slice(0, 500));
      
      // Extract prices from response
      if (data && Array.isArray(data)) {
        const normalPrices = data.find((p: Record<string, unknown>) => p.printingType === "Normal" || p.condition === "Near Mint");
        if (normalPrices) {
          return {
            marketPrice: normalPrices.marketPrice || normalPrices.price,
            lowPrice: normalPrices.lowPrice || normalPrices.lowestPrice,
          };
        }
        // Fallback to first price
        if (data[0]) {
          return {
            marketPrice: data[0].marketPrice || data[0].price,
            lowPrice: data[0].lowPrice || data[0].lowestPrice,
          };
        }
      }
    }
    
    // Try alternate API endpoint
    const altUrl = `https://mpapi.tcgplayer.com/v2/product/${productId}/pricepoints`;
    const altResponse = await fetch(altUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });
    
    if (altResponse.ok) {
      const altData = await altResponse.json();
      console.log("TCGPlayer alt API response:", JSON.stringify(altData).slice(0, 500));
      return {
        marketPrice: altData.marketPrice || altData.price,
        lowPrice: altData.lowPrice,
      };
    }

    return null;
  } catch (error) {
    console.error("TCGPlayer price API error:", error);
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

    // Fetch the product page for name, image, etc.
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    
    // Try to get price from TCGPlayer's API
    const priceData = await fetchTCGPlayerPrice(parsed.productId);
    console.log("Fetched price data:", priceData);

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
      marketPrice: priceData?.marketPrice || extractPriceFromHtml(html),
      listedPrice: priceData?.lowPrice || priceData?.marketPrice,
    };

    // Clean up the name
    if (product.name) {
      // Remove " - Set Name" suffix
      if (product.name.includes(" - ")) {
        product.name = product.name.split(" - ")[0].trim();
      }
      // Remove " | TCGplayer" suffix
      if (product.name.includes(" | ")) {
        product.name = product.name.split(" | ")[0].trim();
      }
    }

    console.log("Extracted product:", {
      ...product,
      htmlLength: html.length,
    });

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
  const regex1 = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const match1 = html.match(regex1);
  if (match1) return match1[1];
  
  const regex2 = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, "i");
  const match2 = html.match(regex2);
  if (match2) return match2[1];
  
  return undefined;
}

function extractProductName(html: string): string | undefined {
  const ogTitle = extractMetaContent(html, "og:title");
  if (ogTitle) return ogTitle;
  
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) return titleMatch[1].trim();
  
  return undefined;
}

function extractSetName(html: string): string | undefined {
  // Look for set name in JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const script of jsonLdMatch) {
      const jsonContent = script.replace(/<\/?script[^>]*>/gi, "");
      try {
        const data = JSON.parse(jsonContent);
        if (data.category) return data.category;
      } catch {
        // Continue
      }
    }
  }
  
  const setMatch = html.match(/"setName"\s*:\s*"([^"]+)"/i);
  if (setMatch) return setMatch[1];

  return undefined;
}

function extractCardNumber(html: string): string | undefined {
  const numberMatch = html.match(/#?\s*(\d+\s*\/\s*\d+)/);
  if (numberMatch) return numberMatch[1].replace(/\s/g, "");
  
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

function extractPriceFromHtml(html: string): number | undefined {
  // Try JSON-LD Product schema
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdMatch) {
    for (const script of jsonLdMatch) {
      const jsonContent = script.replace(/<\/?script[^>]*>/gi, "");
      try {
        const data = JSON.parse(jsonContent);
        if (data["@type"] === "Product" && data.offers) {
          const offers = Array.isArray(data.offers) ? data.offers[0] : data.offers;
          if (offers.price) {
            const price = parseFloat(offers.price);
            if (!isNaN(price) && price > 0) return price;
          }
        }
      } catch {
        // Continue
      }
    }
  }
  
  // Try various price patterns
  const patterns = [
    /"marketPrice":\s*([\d.]+)/i,
    /"price":\s*([\d.]+)/i,
    /data-price=["']?([\d.]+)/i,
  ];
  
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      const price = parseFloat(match[1]);
      if (!isNaN(price) && price > 0 && price < 100000) return price;
    }
  }
  
  return undefined;
}

function extractFromSlug(slug: string, type: "name" | "set"): string {
  const parts = slug.split("-");
  
  if (type === "set" && parts.length >= 3) {
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
