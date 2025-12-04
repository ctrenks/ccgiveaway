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
 * Fetch product data from TCGPlayer
 */
export async function fetchTCGPlayerProduct(url: string): Promise<TCGPlayerProduct | null> {
  try {
    const parsed = parseTCGPlayerUrl(url);
    if (!parsed) {
      throw new Error("Invalid TCGPlayer URL");
    }

    console.log("Fetching TCGPlayer URL:", url);

    // Fetch the product page
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
        "Pragma": "no-cache",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("TCGPlayer fetch failed:", response.status);
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    console.log("TCGPlayer HTML length:", html.length);

    // Log first 2000 chars for debugging
    console.log("HTML preview:", html.substring(0, 2000));

    // Extract data
    const name = extractName(html, parsed.slug);
    const imageUrl = extractImage(html);
    const setName = extractSetName(html, parsed.slug);

    console.log("Extracted - Name:", name, "Image:", imageUrl, "Set:", setName);

    const product: TCGPlayerProduct = {
      productId: parsed.productId,
      url,
      game: parsed.game,
      name,
      setName,
      cardNumber: extractCardNumber(html),
      rarity: extractRarity(html),
      imageUrl,
      marketPrice: 0, // Price requires manual entry
      listedPrice: 0,
    };

    return product;
  } catch (error) {
    console.error("TCGPlayer fetch error:", error);
    return null;
  }
}

function extractName(html: string, slug: string): string {
  // Try og:title
  const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:title["']\s+content=["']([^"']+)["']/i);
  if (ogMatch) {
    let name = ogMatch[1];
    // Clean up name
    name = name.split(" | ")[0].split(" - TCG")[0].trim();
    if (name) return name;
  }

  // Try alternate og:title format
  const ogMatch2 = html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:title["']/i);
  if (ogMatch2) {
    let name = ogMatch2[1];
    name = name.split(" | ")[0].split(" - TCG")[0].trim();
    if (name) return name;
  }

  // Try title tag
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    let name = titleMatch[1];
    name = name.split(" | ")[0].split(" - TCG")[0].trim();
    if (name) return name;
  }

  // Fallback to slug
  return formatSlugAsName(slug);
}

function extractImage(html: string): string | undefined {
  // Try og:image
  const ogMatch = html.match(/<meta\s+(?:property|name)=["']og:image["']\s+content=["']([^"']+)["']/i);
  if (ogMatch && ogMatch[1]) {
    console.log("Found og:image:", ogMatch[1]);
    return ogMatch[1];
  }

  // Try alternate format
  const ogMatch2 = html.match(/<meta\s+content=["']([^"']+)["']\s+(?:property|name)=["']og:image["']/i);
  if (ogMatch2 && ogMatch2[1]) {
    console.log("Found og:image (alt):", ogMatch2[1]);
    return ogMatch2[1];
  }

  // Try twitter:image
  const twitterMatch = html.match(/<meta\s+(?:property|name)=["']twitter:image["']\s+content=["']([^"']+)["']/i);
  if (twitterMatch && twitterMatch[1]) {
    console.log("Found twitter:image:", twitterMatch[1]);
    return twitterMatch[1];
  }

  // Try to find any product image
  const imgMatch = html.match(/product[^"']*image[^"']*["']([^"']+\.(?:jpg|jpeg|png|webp))/i);
  if (imgMatch && imgMatch[1]) {
    console.log("Found product image:", imgMatch[1]);
    return imgMatch[1];
  }

  console.log("No image found in HTML");
  return undefined;
}

function extractSetName(html: string, slug: string): string {
  // Try to find set name in page
  const setMatch = html.match(/"setName"\s*:\s*"([^"]+)"/i);
  if (setMatch) return setMatch[1];

  // Try breadcrumbs or other patterns
  const expansionMatch = html.match(/expansion["'\s:>]+([^"'<,]+)/i);
  if (expansionMatch) return expansionMatch[1].trim();

  // Extract from slug
  return formatSlugAsSet(slug);
}

function extractCardNumber(html: string): string | undefined {
  const match = html.match(/#?\s*(\d+\s*\/\s*\d+)/);
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
  // Skip first part (game name) and take last 3-4 parts as card name
  const nameParts = parts.slice(Math.max(1, parts.length - 4));
  return nameParts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function formatSlugAsSet(slug: string): string {
  const parts = slug.split("-");
  if (parts.length < 3) return "";
  // Skip first part (game) and last 2-3 parts (card name)
  const setParts = parts.slice(1, Math.max(2, parts.length - 3));
  return setParts
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

/**
 * Calculate discounted price
 */
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

/**
 * Map game name to SubType
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
