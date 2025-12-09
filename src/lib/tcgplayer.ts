// TCGPlayer scraper for importing card data using Scrapfly

export interface TCGPlayerProduct {
  productId: string;
  name: string;
  setName: string;
  cardNumber?: string;
  cardType?: string;
  description?: string;
  game: string;
  rarity?: string;
  imageUrl?: string;
  marketPrice?: number;
  foilPrice?: number;
  listedPrice?: number;
  url: string;
  // Additional fields
  legality?: string;
  artist?: string;
  manaCost?: string;
  powerToughness?: string;
}

export interface ImportSettings {
  discountType: "percentage" | "fixed";
  discountValue: number;
}

/**
 * Parse TCGPlayer URL to extract product info
 */
export function parseTCGPlayerUrl(
  url: string
): { productId: string; game: string; slug: string } | null {
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
 * RESTORED TO EXACT WORKING VERSION
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
    scrapflyUrl.searchParams.set("rendering_wait", "3000"); // Wait 3s for JS to render
    // REMOVED wait_for_selector - TCGPlayer changed their HTML, selector doesn't exist anymore

    console.log("Fetching via Scrapfly (no selector, 3s wait):", url);

    const response = await fetch(scrapflyUrl.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Scrapfly HTTP error:", response.status);
      console.error("Scrapfly error body:", errorText);
      return null;
    }

    const data = await response.json();

    if (data.result?.content) {
      const html = data.result.content;
      console.log("✓ Scrapfly returned HTML, length:", html.length);
      
      // Check if it's the Vue shell (no prices)
      if (html.includes("hostInit") && html.length < 50000) {
        console.warn("⚠️ Vue shell only - prices not rendered");
      }
      
      return html;
    }

    console.error("✗ No content in Scrapfly response");
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
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
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
 * Extract both normal and foil prices from HTML
 * Returns { normal: number, foil: number }
 */
function extractPricesFromHTML(html: string): { normal: number; foil: number } {
  let normalPrice = 0;
  let foilPrice = 0;

  console.log("=== Extracting Prices ===");

  // Log all dollar amounts found in HTML
  const dollarMatches = html.match(/\$[\d,]+\.?\d*/g);
  if (dollarMatches && dollarMatches.length > 0) {
    console.log(
      "Dollar amounts in HTML:",
      dollarMatches.slice(0, 10).join(", ")
    );
  } else {
    console.log("⚠️ NO dollar amounts found in HTML");
  }

  // Try to find the near-mint table with both prices
  const nearMintTableMatch = html.match(/near-mint-table[^]*?<\/table>/i);
  if (nearMintTableMatch) {
    const tableHtml = nearMintTableMatch[0];
    console.log("✓ Found near-mint table");

    // Extract Normal price
    const normalMatch = tableHtml.match(/Normal[^$]*\$([\d,]+\.?\d*)/i);
    if (normalMatch && normalMatch[1]) {
      normalPrice = parseFloat(normalMatch[1].replace(/,/g, ""));
      console.log("✓ Normal price:", normalPrice);
    } else {
      console.log("✗ Normal price not found in table");
    }

    // Extract Foil price
    const foilMatch = tableHtml.match(/Foil[^$]*\$([\d,]+\.?\d*)/i);
    if (foilMatch && foilMatch[1]) {
      foilPrice = parseFloat(foilMatch[1].replace(/,/g, ""));
      console.log("✓ Foil price:", foilPrice);
    } else {
      console.log("✗ Foil price not found in table");
    }
  } else {
    console.log("✗ near-mint-table not found");
  }

  // If we didn't find prices in the table, fall back to old method (gets one price)
  if (normalPrice === 0) {
    console.log("Trying extractSinglePrice fallback...");
    normalPrice = extractSinglePrice(html);
  }

  console.log(
    "=== Final: Normal=$" + normalPrice + ", Foil=$" + foilPrice + " ==="
  );
  return { normal: normalPrice, foil: foilPrice };
}

/**
 * Extract a single price from HTML (fallback for old method)
 */
function extractSinglePrice(html: string): number {
  // TCGPlayer Market Price is in: <span class="price-points__upper__price">$38.28</span>
  // Try multiple patterns to find this specific element

  const patterns = [
    // Direct class match with content
    /class="[^"]*price-points__upper__price[^"]*"[^>]*>\s*\$([\d,]+\.?\d*)/i,
    // With data attributes (Vue)
    /price-points__upper__price[^>]*>\s*\$([\d,]+\.?\d*)/i,
    // Market price label nearby
    /Market\s*Price[^<]*<[^>]*>\s*\$([\d,]+\.?\d*)/i,
    // In a span right after market price text
    />Market\s*Price<\/[^>]+>[^$]*\$([\d,]+\.?\d*)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1].replace(/,/g, ""));
      if (price > 0) {
        console.log(
          "Found market price:",
          price,
          "via pattern:",
          pattern.toString().slice(0, 50)
        );
        return price;
      }
    }
  }

  // Look for the price-points section and extract price from it
  const priceSection = html.match(
    /price-points__upper[^]*?price-points__upper__price[^>]*>([^<]+)/i
  );
  if (priceSection && priceSection[1]) {
    const priceMatch = priceSection[1].match(/\$([\d,]+\.?\d*)/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/,/g, ""));
      if (price > 0) {
        console.log("Found price in price-points section:", price);
        return price;
      }
    }
  }

  // Try to find "Market Price" text and the price near it (within 500 chars)
  const marketPriceIndex = html.indexOf("Market Price");
  if (marketPriceIndex > -1) {
    const nearbyHtml = html.substring(marketPriceIndex, marketPriceIndex + 500);
    console.log(
      "Near Market Price:",
      nearbyHtml.replace(/\s+/g, " ").slice(0, 200)
    );

    const nearbyPriceMatch = nearbyHtml.match(/\$([\d,]+\.[\d]{2})/);
    if (nearbyPriceMatch) {
      const price = parseFloat(nearbyPriceMatch[1].replace(/,/g, ""));
      if (price > 0) {
        console.log("Found price near 'Market Price' text:", price);
        return price;
      }
    }
  }

  // Fallback: JSON patterns in script tags
  const jsonPatterns = [
    /"marketPrice"\s*:\s*([\d.]+)/i,
    /"lowPrice"\s*:\s*([\d.]+)/i,
  ];

  for (const pattern of jsonPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const price = parseFloat(match[1]);
      if (price > 0) {
        console.log("Found price via JSON:", price);
        return price;
      }
    }
  }

  console.log("No market price found in HTML");
  return 0;
}

/**
 * Fetch product data from TCGPlayer's public API
 * Much faster and more reliable than HTML scraping!
 */
async function fetchFromTCGPlayerAPI(productId: string): Promise<any | null> {
  try {
    const apiUrl = `https://mp-search-api.tcgplayer.com/v1/product/${productId}/details`;
    console.log("Fetching from TCGPlayer API:", apiUrl);

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      console.error("TCGPlayer API error:", response.status);
      return null;
    }

    const data = await response.json();
    console.log("TCGPlayer API response:", data);
    return data;
  } catch (error) {
    console.error("TCGPlayer API fetch error:", error);
    return null;
  }
}

/**
 * Convert API data to our TCGPlayerProduct format
 */
function parseAPIData(
  apiData: any,
  url: string,
  game: string
): Partial<TCGPlayerProduct> {
  const attrs = apiData.customAttributes || {};
  const formatted = apiData.formattedAttributes || {};

  // Parse mana cost from TCGPlayer data
  let manaCost: string | undefined = undefined;
  if (attrs.convertedCost) {
    const cmc = parseInt(attrs.convertedCost);
    const colors = attrs.color || [];

    if (colors.length > 0) {
      const colorSymbols: Record<string, string> = {
        White: "W",
        Blue: "U",
        Black: "B",
        Red: "R",
        Green: "G",
        Colorless: "C",
      };
      const symbols = colors
        .map((c: string) => colorSymbols[c] || "")
        .filter(Boolean);

      if (symbols.length > 0) {
        const generic = Math.max(0, cmc - symbols.length);
        manaCost = "";
        if (generic > 0) {
          manaCost = `{${generic}}`;
        }
        symbols.forEach((s: string) => {
          manaCost += `{${s}}`;
        });
      }
    } else if (cmc > 0) {
      manaCost = `{${cmc}}`;
    } else if (cmc === 0) {
      manaCost = "{0}";
    }
  }

  // Parse legality from formats (TCGPlayer doesn't always have this)
  let legality: string | undefined = undefined;
  if (
    attrs.formats &&
    Array.isArray(attrs.formats) &&
    attrs.formats.length > 0
  ) {
    legality = attrs.formats.join(", ");
  }

  // Parse power/toughness
  let powerToughness: string | undefined = undefined;
  if (attrs.power !== null && attrs.toughness !== null) {
    powerToughness = `${attrs.power}/${attrs.toughness}`;
  } else if (attrs.power === "*" || attrs.toughness === "*") {
    powerToughness = `${attrs.power || "*"}/${attrs.toughness || "*"}`;
  }

  // Combine card name and set name for better display
  const cardName = apiData.productName || "";
  const setName = apiData.setName || "";
  const fullName = setName ? `${cardName} - ${setName}` : cardName;

  return {
    productId: apiData.productId?.toString() || "",
    name: fullName,
    setName: apiData.setName || "",
    cardNumber: attrs.number || formatted["#"] || undefined,
    cardType: attrs.fullType || formatted["Card Type"] || undefined,
    description: attrs.description || formatted["Description"] || undefined,
    rarity: apiData.rarityName || undefined,
    imageUrl:
      apiData.imageUrl ||
      `https://tcgplayer-cdn.tcgplayer.com/product/${apiData.productId}_200w.jpg` ||
      undefined,
    game,
    url,
    legality,
    artist: formatted["Artist"] || undefined,
    manaCost,
    powerToughness,
    marketPrice: apiData.marketPrice || 0,
    foilPrice: 0, // TCGPlayer API doesn't separate foil prices easily
    listedPrice: apiData.lowestPrice || apiData.marketPrice || 0,
  };
}

/**
 * Fetch product data only (no prices) from TCGPlayer using API
 * Faster and doesn't require Scrapfly - use for updating card data
 */
export async function fetchTCGPlayerProductData(
  url: string
): Promise<Omit<
  TCGPlayerProduct,
  "marketPrice" | "foilPrice" | "listedPrice"
> | null> {
  try {
    const parsed = parseTCGPlayerUrl(url);
    if (!parsed) {
      throw new Error("Invalid TCGPlayer URL");
    }

    console.log("Fetching TCGPlayer product data via API:", parsed.productId);

    // Use TCGPlayer API
    const apiData = await fetchFromTCGPlayerAPI(parsed.productId);

    if (!apiData) {
      console.log("API fetch failed, falling back to HTML scraping...");
      // Fallback to HTML scraping if API fails
      return await fetchViaHTMLScraping(url, parsed);
    }

    // Parse API data
    const product = parseAPIData(apiData, url, parsed.game);

    console.log("Extracted from API:", {
      name: product.name,
      setName: product.setName,
      cardNumber: product.cardNumber,
      cardType: product.cardType?.substring(0, 50),
      description: product.description?.substring(0, 50),
      rarity: product.rarity,
      artist: product.artist,
      manaCost: product.manaCost,
      powerToughness: product.powerToughness,
    });

    // Remove price fields for this function
    const { marketPrice, foilPrice, listedPrice, ...dataOnly } =
      product as TCGPlayerProduct;
    return dataOnly;
  } catch (error) {
    console.error("TCGPlayer fetch error:", error);
    return null;
  }
}

/**
 * Fallback HTML scraping method (if API fails)
 */
async function fetchViaHTMLScraping(
  url: string,
  parsed: { productId: string; game: string; slug: string }
): Promise<Omit<
  TCGPlayerProduct,
  "marketPrice" | "foilPrice" | "listedPrice"
> | null> {
  const html = await fetchDirect(url);
  if (!html) return null;

  const name = extractName(html, parsed.slug);
  const imageUrl = extractImage(html);
  const setName = extractSetName(html, parsed.slug);
  const cardType = extractCardType(html);
  const description = extractDescription(html);
  const cardNumber = extractCardNumber(html);
  const rarity = extractRarity(html);
  const legality = extractLegality(html);
  const artist = extractArtist(html);
  const manaCost = extractManaCost(html);
  const powerToughness = extractPowerToughness(html);

  return {
    productId: parsed.productId,
    url,
    game: parsed.game,
    name,
    setName,
    cardNumber,
    cardType,
    description,
    rarity,
    imageUrl,
    legality,
    artist,
    manaCost,
    powerToughness,
  };
}

/**
 * Fetch product data from TCGPlayer using API (fast, for imports)
 * Prices are entered manually during import, then updated by cron job
 */
export async function fetchTCGPlayerProduct(
  url: string
): Promise<TCGPlayerProduct | null> {
  try {
    const parsed = parseTCGPlayerUrl(url);
    if (!parsed) {
      throw new Error("Invalid TCGPlayer URL");
    }

    console.log("Fetching TCGPlayer product via API:", parsed.productId);

    // Get card data from API (fast - no Scrapfly needed for import)
    const apiData = await fetchFromTCGPlayerAPI(parsed.productId);

    if (apiData) {
      const product = parseAPIData(
        apiData,
        url,
        parsed.game
      ) as TCGPlayerProduct;

      console.log("Product data from API:", {
        name: product.name,
        setName: product.setName,
        cardNumber: product.cardNumber,
        cardType: product.cardType,
        manaCost: product.manaCost,
        artist: product.artist,
        marketPrice: product.marketPrice,
      });

      return product;
    }

    // Fallback to HTML scraping if API fails
    console.log("API failed, falling back to HTML scraping...");
    const html = await fetchDirect(url);
    if (!html) {
      throw new Error("Failed to fetch page content");
    }

    const name = extractName(html, parsed.slug);
    const imageUrl = extractImage(html);
    const setName = extractSetName(html, parsed.slug);
    const cardType = extractCardType(html);
    const description = extractDescription(html);

    const product: TCGPlayerProduct = {
      productId: parsed.productId,
      url,
      game: parsed.game,
      name,
      setName,
      cardNumber: extractCardNumber(html),
      cardType,
      description,
      rarity: extractRarity(html),
      imageUrl,
      marketPrice: 0,
      foilPrice: 0,
      listedPrice: 0,
      legality: extractLegality(html),
      artist: extractArtist(html),
      manaCost: extractManaCost(html),
      powerToughness: extractPowerToughness(html),
    };

    return product;
  } catch (error) {
    console.error("TCGPlayer fetch error:", error);
    return null;
  }
}

/**
 * Fetch product with prices from Scrapfly (for cron price updates)
 * Gets accurate normal/foil price separation PLUS all card data
 */
export async function fetchTCGPlayerProductWithPrices(
  url: string
): Promise<TCGPlayerProduct | null> {
  try {
    const parsed = parseTCGPlayerUrl(url);
    if (!parsed) {
      throw new Error("Invalid TCGPlayer URL");
    }

    console.log(
      "Fetching TCGPlayer product WITH PRICES (API primary, HTML fallback):",
      parsed.productId
    );

    // Fetch HTML first (needed for fallback)
    let html = await fetchWithScrapfly(url);
    if (!html) {
      console.log("Scrapfly failed, trying direct fetch...");
      html = await fetchDirect(url);
    }

    // Get card data from API (reliable and has marketPrice)
    const apiData = await fetchFromTCGPlayerAPI(parsed.productId);

    if (apiData) {
      // Use API data
      const product = parseAPIData(
        apiData,
        url,
        parsed.game
      ) as TCGPlayerProduct;
      console.log("✓ API marketPrice:", product.marketPrice);

      // Try to get more accurate foil/normal separation from HTML
      if (html) {
        const prices = extractPricesFromHTML(html);
        console.log("HTML prices - Normal:", prices.normal, "Foil:", prices.foil);
        
        // Use HTML prices if available (more accurate separation)
        if (prices.normal > 0 || prices.foil > 0) {
          console.log("✓ Using HTML prices");
          product.marketPrice = prices.normal || product.marketPrice || 0;
          product.foilPrice = prices.foil || 0;
          product.listedPrice = prices.normal || product.marketPrice || 0;
        } else {
          console.log("⚠️ HTML prices not found, using API marketPrice");
          // API prices already set by parseAPIData
        }

        // Extract legality from HTML if not in API
        if (!product.legality) {
          product.legality = extractLegality(html);
        }
      } else {
        console.log("⚠️ No HTML available, using API marketPrice only");
      }

      return product;
    }

    // Fallback to pure HTML scraping if API fails
    if (!html) {
      throw new Error("Failed to fetch page content");
    }

    const prices = extractPricesFromHTML(html);
    const product: TCGPlayerProduct = {
      productId: parsed.productId,
      url,
      game: parsed.game,
      name: extractName(html, parsed.slug),
      setName: extractSetName(html, parsed.slug),
      cardNumber: extractCardNumber(html),
      cardType: extractCardType(html),
      description: extractDescription(html),
      rarity: extractRarity(html),
      imageUrl: extractImage(html),
      marketPrice: prices.normal,
      foilPrice: prices.foil,
      listedPrice: prices.normal,
      legality: extractLegality(html),
      artist: extractArtist(html),
      manaCost: extractManaCost(html),
      powerToughness: extractPowerToughness(html),
    };

    return product;
  } catch (error) {
    console.error("TCGPlayer fetch error:", error);
    return null;
  }
}

function extractName(html: string, slug: string): string {
  // First try to extract from breadcrumb - most accurate
  // <a href="..." class="breadcrumb__link">Jetmir's Garden (Showcase)</a>
  const breadcrumbPatterns = [
    /breadcrumb__link[^>]*>([^<]+)<\/a>\s*<\/li>\s*<\/ul>/i, // Last breadcrumb item
    /breadcrumb[^>]*>[^<]*<[^>]*>[^<]*<[^>]*>([^<]+)<\/a>\s*<\/li>\s*<\/ul>/i,
  ];

  for (const pattern of breadcrumbPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let name = match[1].trim();
      // Decode HTML entities
      name = decodeHtmlEntities(name);
      if (name && name.length > 2 && !name.includes("TCGplayer")) {
        console.log("Extracted name from breadcrumb:", name);
        return name;
      }
    }
  }

  // Fallback to og:title
  const patterns = [
    /<meta\s+property=["']og:title["']\s+content="([^"]+)"/i,
    /<meta\s+property=["']og:title["']\s+content='([^']+)'/i,
    /<meta\s+content="([^"]+)"\s+property=["']og:title["']/i,
    /<meta\s+content='([^']+)'\s+property=["']og:title["']/i,
    /<meta\s+name=["']og:title["']\s+content="([^"]+)"/i,
    /<meta\s+name=["']og:title["']\s+content='([^']+)'/i,
    /<title[^>]*>([^<]+)<\/title>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let name = match[1];
      // Decode HTML entities
      name = decodeHtmlEntities(name);
      // Clean up
      name = name
        .split(" | ")[0]
        .split(" - TCG")[0]
        .split(" - Price")[0]
        .trim();
      if (name && name.length > 2) return name;
    }
  }

  return formatSlugAsName(slug);
}

function decodeHtmlEntities(text: string): string {
  // Decode common HTML entities
  return text
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
    .replace(/&#x([0-9a-f]+);/gi, (match, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

function extractImage(html: string): string | undefined {
  const patterns = [
    /<meta\s+property=["']og:image["']\s+content="([^"]+)"/i,
    /<meta\s+property=["']og:image["']\s+content='([^']+)'/i,
    /<meta\s+content="([^"]+)"\s+property=["']og:image["']/i,
    /<meta\s+content='([^']+)'\s+property=["']og:image["']/i,
    /<meta\s+name=["']twitter:image["']\s+content="([^"]+)"/i,
    /<meta\s+name=["']twitter:image["']\s+content='([^']+)'/i,
    /<meta\s+property=["']twitter:image["']\s+content="([^"]+)"/i,
    /<meta\s+property=["']twitter:image["']\s+content='([^']+)'/i,
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
  // Try multiple patterns for card/collector number
  const patterns = [
    // Pattern: "Number: 123" or "Card Number: 123"
    /(?:Card\s+)?(?:Number|#):\s*<\/[^>]+>\s*<[^>]+>([^<]+)/i,
    /(?:Card\s+)?(?:Number|#):\s*([^\n<]+)/i,
    // Pattern: "123/456" format
    /#?\s*(\d{1,4}\s*\/\s*\d{1,4})/,
    // Pattern: In JSON data
    /"number"\s*:\s*"([^"]+)"/i,
    /data-number=["']([^"']+)["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let number = match[1].trim().replace(/\s/g, "");
      if (number && number.length > 0 && number !== "null") {
        console.log("Extracted card number:", number);
        return number;
      }
    }
  }
  return undefined;
}

function extractRarity(html: string): string | undefined {
  const rarities = [
    "Mythic Rare",
    "Secret Rare",
    "Ultra Rare",
    "Illustration Rare",
    "Special Art Rare",
    "Holo Rare",
    "Rare",
    "Uncommon",
    "Common",
  ];

  const lowerHtml = html.toLowerCase();
  for (const rarity of rarities) {
    if (lowerHtml.includes(rarity.toLowerCase())) {
      return rarity;
    }
  }
  return undefined;
}

function extractLegality(html: string): string | undefined {
  // Extract legality information (Standard, Modern, Commander, etc.)
  const patterns = [
    /Legality:\s*<\/[^>]+>\s*<[^>]+>([^<]+)/i,
    /Legality:\s*([^\n<]+)/i,
    /<dt[^>]*>Legality<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i,
    /"legality"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let legality = match[1].trim();
      legality = decodeHtmlEntities(legality);
      if (legality && legality.length > 0 && legality !== "null") {
        console.log("Extracted legality:", legality);
        return legality;
      }
    }
  }
  return undefined;
}

function extractArtist(html: string): string | undefined {
  const patterns = [
    /Artist:\s*<\/[^>]+>\s*<[^>]+>([^<]+)/i,
    /Artist:\s*([^\n<]+)/i,
    /<dt[^>]*>Artist<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i,
    /"artist"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let artist = match[1].trim();
      artist = decodeHtmlEntities(artist);
      if (artist && artist.length > 0 && artist !== "null") {
        console.log("Extracted artist:", artist);
        return artist;
      }
    }
  }
  return undefined;
}

function extractManaCost(html: string): string | undefined {
  // Extract mana cost for Magic cards (e.g., "{3}{U}{B}")
  const patterns = [
    /Mana Cost:\s*<\/[^>]+>\s*<[^>]+>([^<]+)/i,
    /Mana Cost:\s*([^\n<]+)/i,
    /<dt[^>]*>Mana Cost<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i,
    /"manaCost"\s*:\s*"([^"]+)"/i,
    // Pattern for mana symbols: {1}{U}{B}
    /(\{[^\}]+\}(?:\{[^\}]+\})*)/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let manaCost = match[1].trim();
      manaCost = decodeHtmlEntities(manaCost);
      if (manaCost && manaCost.length > 0 && manaCost !== "null") {
        console.log("Extracted mana cost:", manaCost);
        return manaCost;
      }
    }
  }
  return undefined;
}

function extractPowerToughness(html: string): string | undefined {
  // Extract P/T for creatures (e.g., "3/3" or "*/4")
  const patterns = [
    /P\s*\/\s*T:\s*<\/[^>]+>\s*<[^>]+>([^<]+)/i,
    /P\s*\/\s*T:\s*([^\n<]+)/i,
    /Power\s*\/\s*Toughness:\s*<\/[^>]+>\s*<[^>]+>([^<]+)/i,
    /Power\s*\/\s*Toughness:\s*([^\n<]+)/i,
    /<dt[^>]*>P\s*\/\s*T<\/dt>\s*<dd[^>]*>([^<]+)<\/dd>/i,
    /"powerToughness"\s*:\s*"([^"]+)"/i,
    // Pattern: "3/3" or "*/4" format
    /\b(\d+|\*)\s*\/\s*(\d+|\*)\b/,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) {
      let pt = match[1] || (match[2] ? `${match[1]}/${match[2]}` : null);
      if (pt) {
        pt = pt.trim();
        pt = decodeHtmlEntities(pt);
        if (
          pt &&
          pt.length > 0 &&
          pt !== "null" &&
          /^\d+|\*\/\d+|\*$/.test(pt)
        ) {
          console.log("Extracted power/toughness:", pt);
          return pt;
        }
      }
    }
  }
  return undefined;
}

function extractCardType(html: string): string | undefined {
  // Extract card type from detail sections
  // Common patterns:
  // "Card Type: Land — Mountain Forest Plains"
  // "Card Type:</span><span>Instant</span>"
  // "Type: Creature — Human Soldier"

  const patterns = [
    /Card Type:\s*<\/[^>]+>\s*<[^>]+>([^<]+)</i,
    /Card Type:\s*([^\n<]+)/i,
    /Type:\s*<\/[^>]+>\s*<[^>]+>([^<]+)</i,
    /Type:\s*([^\n<]+)/i,
    /"cardType"\s*:\s*"([^"]+)"/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let cardType = match[1].trim();
      // Decode HTML entities and clean up
      cardType = decodeHtmlEntities(cardType);
      cardType = cardType.replace(/\s+/g, " ").trim();
      if (cardType && cardType.length > 0 && cardType !== "null") {
        console.log("Extracted card type:", cardType);
        return cardType;
      }
    }
  }

  return undefined;
}

function extractDescription(html: string): string | undefined {
  // Extract card description/text from detail sections
  // Common patterns:
  // "Card Text:</span><span>Enter the battlefield tapped...</span>"
  // "Card Text: Tap: Add R, G, or W."
  // Meta description tag

  const patterns = [
    /Card Text:\s*<\/[^>]+>\s*<[^>]+>([^<]+)</i,
    /Card Text:\s*([^\n<]+(?:<br[^>]*>[^\n<]+)*)/i,
    /Text:\s*<\/[^>]+>\s*<[^>]+>([^<]+)</i,
    /Ability:\s*<\/[^>]+>\s*<[^>]+>([^<]+)</i,
    /<meta\s+name=["']description["']\s+content="([^"]+)"/i,
    /<meta\s+name=["']description["']\s+content='([^']+)'/i,
    /<meta\s+property=["']og:description["']\s+content="([^"]+)"/i,
    /<meta\s+property=["']og:description["']\s+content='([^']+)'/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      let description = match[1].trim();
      // Decode HTML entities and clean up
      description = decodeHtmlEntities(description);
      description = description
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/\s+/g, " ")
        .trim();

      // Filter out generic TCGPlayer descriptions
      if (
        description &&
        description.length > 5 &&
        !description.includes("TCGplayer") &&
        !description.includes("Buy and sell") &&
        description !== "null"
      ) {
        console.log("Extracted description:", description.substring(0, 100));
        return description;
      }
    }
  }

  return undefined;
}

function formatSlugAsName(slug: string): string {
  const parts = slug.split("-");
  const nameParts = parts.slice(Math.max(1, parts.length - 4));
  return nameParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
}

function formatSlugAsSet(slug: string): string {
  const parts = slug.split("-");
  if (parts.length < 3) return "";
  const setParts = parts.slice(1, Math.max(2, parts.length - 3));
  return setParts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
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
  return (
    mapping[game.toLowerCase()] ||
    game.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
