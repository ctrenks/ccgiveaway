// TCGPlayer scraper for importing card data

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
 * Fetch price from TCGPlayer's API
 */
async function fetchPriceFromAPI(productId: string): Promise<{ marketPrice: number; lowPrice: number } | null> {
  const endpoints = [
    // Main marketplace API
    `https://mp-search-api.tcgplayer.com/v1/product/${productId}/pricepoints`,
    // Alternate API
    `https://mpapi.tcgplayer.com/v2/product/${productId}/pricepoints`,
    // Product details API
    `https://mpapi.tcgplayer.com/v2/product/${productId}/details`,
    // Another variant
    `https://www.tcgplayer.com/api/v2/product/${productId}/pricepoints`,
  ];

  for (const apiUrl of endpoints) {
    try {
      console.log("Trying price API:", apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Accept-Language": "en-US,en;q=0.9",
          "Origin": "https://www.tcgplayer.com",
          "Referer": "https://www.tcgplayer.com/",
        },
        cache: "no-store",
      });

      console.log("API response status:", response.status);

      if (response.ok) {
        const text = await response.text();
        console.log("API response:", text.substring(0, 500));

        try {
          const data = JSON.parse(text);

          // Try to extract price from various response formats
          if (Array.isArray(data)) {
            for (const item of data) {
              if (item.marketPrice || item.price) {
                return {
                  marketPrice: item.marketPrice || item.price || 0,
                  lowPrice: item.lowPrice || item.lowestPrice || item.marketPrice || 0,
                };
              }
            }
          } else if (data.marketPrice || data.price) {
            return {
              marketPrice: data.marketPrice || data.price || 0,
              lowPrice: data.lowPrice || data.lowestPrice || 0,
            };
          } else if (data.results && Array.isArray(data.results)) {
            for (const item of data.results) {
              if (item.marketPrice || item.price) {
                return {
                  marketPrice: item.marketPrice || item.price || 0,
                  lowPrice: item.lowPrice || item.lowestPrice || 0,
                };
              }
            }
          }
        } catch (e) {
          console.log("Failed to parse JSON:", e);
        }
      }
    } catch (error) {
      console.log("API request failed:", error);
    }
  }

  return null;
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

    console.log("Fetching TCGPlayer product:", parsed.productId);

    // Try to get price from API first
    const priceData = await fetchPriceFromAPI(parsed.productId);
    console.log("Price data from API:", priceData);

    // Fetch the product page for other data
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Page fetch failed:", response.status);
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();
    console.log("HTML length:", html.length);

    // Extract data from HTML
    const name = extractName(html, parsed.slug);
    const imageUrl = extractImage(html);
    const setName = extractSetName(html, parsed.slug);

    console.log("Extracted:", { name, imageUrl: imageUrl?.substring(0, 50), setName });

    const product: TCGPlayerProduct = {
      productId: parsed.productId,
      url,
      game: parsed.game,
      name,
      setName,
      cardNumber: extractCardNumber(html),
      rarity: extractRarity(html),
      imageUrl,
      marketPrice: priceData?.marketPrice || 0,
      listedPrice: priceData?.lowPrice || 0,
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
