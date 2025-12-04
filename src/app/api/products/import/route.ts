import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";
import {
  fetchTCGPlayerProduct,
  parseTCGPlayerUrl,
  calculateDiscountedPrice,
  mapGameToSubType,
  type ImportSettings,
} from "@/lib/tcgplayer";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/**
 * Try to copy image to Vercel Blob (optional - fails gracefully)
 */
async function copyImageToBlob(imageUrl: string, productName: string): Promise<string | null> {
  // Check if Blob token is configured
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    console.log("BLOB_READ_WRITE_TOKEN not set, using original image URL");
    return imageUrl; // Return original URL as fallback
  }

  try {
    console.log("Copying image to Blob:", imageUrl);

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });

    if (!response.ok) {
      console.error("Failed to fetch image:", response.status);
      return imageUrl; // Return original URL as fallback
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";
    const extension = contentType.includes("png") ? "png" :
                      contentType.includes("webp") ? "webp" :
                      contentType.includes("gif") ? "gif" : "jpg";

    const imageBuffer = await response.arrayBuffer();
    const filename = `products/${slugify(productName)}-${Date.now()}.${extension}`;

    // Dynamic import to avoid issues if blob is not configured
    const { put } = await import("@vercel/blob");

    const blob = await put(filename, imageBuffer, {
      access: "public",
      contentType,
    });

    console.log("Image uploaded to Blob:", blob.url);
    return blob.url;
  } catch (error) {
    console.error("Error copying image to Blob:", error);
    return imageUrl; // Return original URL as fallback
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user || session.user.role < ROLES.MODERATOR) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, quantity = 1, condition = "NEW", manualPrice, discountType, discountValue } = body;

    console.log("Import request:", { url, quantity, condition, manualPrice, discountType, discountValue });

    if (!url) {
      return NextResponse.json({ error: "TCGPlayer URL is required" }, { status: 400 });
    }

    // Validate URL
    const parsed = parseTCGPlayerUrl(url);
    if (!parsed) {
      return NextResponse.json({ error: "Invalid TCGPlayer URL" }, { status: 400 });
    }

    // Check if product already exists
    const existing = await prisma.product.findUnique({
      where: { tcgPlayerId: parsed.productId },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Product already imported", product: existing },
        { status: 409 }
      );
    }

    // Fetch product data from TCGPlayer
    const tcgProduct = await fetchTCGPlayerProduct(url);
    console.log("TCGPlayer product:", tcgProduct);

    if (!tcgProduct) {
      return NextResponse.json(
        { error: "Failed to fetch product data from TCGPlayer. Check the URL and try again." },
        { status: 400 }
      );
    }

    // Get discount settings - use custom values if provided, otherwise use defaults
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    const discountSettings: ImportSettings = {
      discountType: discountType || (settings?.discountType as "percentage" | "fixed") || "percentage",
      discountValue: discountValue ?? (settings?.discountValue ? Number(settings.discountValue) : 10),
    };

    console.log("Using discount settings:", discountSettings);

    // Use manual price (required since TCGPlayer blocks scraping)
    const originalPrice = manualPrice || 0;
    const ourPrice = originalPrice > 0 ? calculateDiscountedPrice(originalPrice, discountSettings) : 0;

    // Try to copy image to Blob (optional)
    let imageUrl = tcgProduct.imageUrl || null;
    if (imageUrl) {
      imageUrl = await copyImageToBlob(imageUrl, tcgProduct.name);
    }

    // Find or create category
    let category = await prisma.category.findUnique({
      where: { slug: "trading-cards" },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: "Trading Cards", slug: "trading-cards" },
      });
    }

    // Find or create subType
    const subTypeName = mapGameToSubType(tcgProduct.game);
    let subType = await prisma.subType.findUnique({
      where: { name: subTypeName },
    });
    if (!subType) {
      subType = await prisma.subType.create({
        data: { name: subTypeName },
      });
    }

    // Generate unique slug
    let baseSlug = slugify(tcgProduct.name);
    if (!baseSlug) baseSlug = "product";
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        name: tcgProduct.name || "Unnamed Product",
        slug,
        setName: tcgProduct.setName || null,
        cardNumber: tcgProduct.cardNumber || null,
        rarity: tcgProduct.rarity || null,
        image: imageUrl,
        price: ourPrice,
        originalPrice: originalPrice,
        quantity,
        condition: condition as "NEW" | "OPENED" | "USED",
        categoryId: category.id,
        subTypeId: subType.id,
        tcgPlayerId: tcgProduct.productId,
        tcgPlayerUrl: url,
        lastPriceSync: new Date(),
        active: true,
      },
      include: {
        category: true,
        subType: true,
      },
    });

    console.log("Product created:", product.id);

    return NextResponse.json({
      success: true,
      product,
      priceInfo: {
        tcgPlayerPrice: originalPrice,
        ourPrice,
        discount: discountSettings,
      },
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: `Failed to import product: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}

// GET - Preview import without saving
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role < ROLES.MODERATOR) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl.searchParams.get("url");
    if (!url) {
      return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
    }

    console.log("Preview request for:", url);

    const tcgProduct = await fetchTCGPlayerProduct(url);
    console.log("Preview product:", tcgProduct);

    if (!tcgProduct) {
      return NextResponse.json(
        { error: "Failed to fetch product data. Check the URL and try again." },
        { status: 400 }
      );
    }

    // Get discount settings
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    const discountSettings: ImportSettings = {
      discountType: (settings?.discountType as "percentage" | "fixed") || "percentage",
      discountValue: settings?.discountValue ? Number(settings.discountValue) : 10,
    };

    // Calculate discounted price if we got a price
    const tcgPrice = tcgProduct.marketPrice || 0;
    const ourPrice = tcgPrice > 0 ? calculateDiscountedPrice(tcgPrice, discountSettings) : 0;

    return NextResponse.json({
      preview: true,
      product: tcgProduct,
      priceInfo: {
        tcgPlayerPrice: tcgPrice,
        ourPrice: ourPrice,
        discount: discountSettings,
        savings: tcgPrice - ourPrice,
      },
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: `Failed to preview: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 }
    );
  }
}
