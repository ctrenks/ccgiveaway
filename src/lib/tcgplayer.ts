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
      },
      next: { revalidate: 0 }, // Don't cache
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // Extract data from meta tags and page content
    const product: TCGPlayerProduct = {
      productId: parsed.productId,
      url,
      game: parsed.game,
      name: extractMetaContent(html, "og:title") || extractFromSlug(parsed.slug, "name"),
      setName: extractSetName(html) || extractFromSlug(parsed.slug, "set"),
      cardNumber: extractCardNumber(html),
      rarity: extractRarity(html),
      imageUrl: extractMetaContent(html, "og:image"),
      marketPrice: extractPrice(html, "market"),
      listedPrice: extractPrice(html, "listed"),
    };

    // Clean up the name (remove set name suffix if present)
    if (product.name.includes(" - ")) {
      product.name = product.name.split(" - ")[0].trim();
    }

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
  const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, "i");
  const altRegex = new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, "i");

  const match = html.match(regex) || html.match(altRegex);
  return match?.[1];
}

function extractSetName(html: string): string | undefined {
  // Look for set name in structured data or specific elements
  const setMatch = html.match(/"setName"\s*:\s*"([^"]+)"/i);
  if (setMatch) return setMatch[1];

  // Try to find in breadcrumb or product details
  const breadcrumbMatch = html.match(/data-testid="breadcrumb"[^>]*>([^<]+)</);
  return breadcrumbMatch?.[1];
}

function extractCardNumber(html: string): string | undefined {
  // Look for card number pattern like "#102/165" or "102/165"
  const numberMatch = html.match(/#?\d+\s*\/\s*\d+/);
  return numberMatch?.[0]?.replace("#", "").trim();
}

function extractRarity(html: string): string | undefined {
  // Common rarities
  const rarities = ["Mythic Rare", "Rare", "Uncommon", "Common", "Secret Rare", "Ultra Rare", "Holo Rare"];
  for (const rarity of rarities) {
    if (html.toLowerCase().includes(rarity.toLowerCase())) {
      return rarity;
    }
  }
  return undefined;
}

function extractPrice(html: string, type: "market" | "listed"): number | undefined {
  // Look for price patterns
  const pricePatterns = [
    /"price"\s*:\s*"?\$?([\d.]+)"?/i,
    /market\s*price[^$]*\$([\d.]+)/i,
    /\$([\d.]+)/,
  ];

  for (const pattern of pricePatterns) {
    const match = html.match(pattern);
    if (match) {
      const price = parseFloat(match[1]);
      if (!isNaN(price) && price > 0) {
        return price;
      }
    }
  }
  return undefined;
}

function extractFromSlug(slug: string, type: "name" | "set"): string {
  const parts = slug.split("-");

  if (type === "set" && parts.length >= 3) {
    // Set name is typically the 2nd and 3rd parts
    // e.g., "magic-modern-horizons-3-card-name" -> "modern horizons 3"
    return parts.slice(1, -2).join(" ").replace(/\b\w/g, c => c.toUpperCase());
  }

  if (type === "name") {
    // Card name is typically the last parts
    return parts.slice(-2).join(" ").replace(/\b\w/g, c => c.toUpperCase());
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
