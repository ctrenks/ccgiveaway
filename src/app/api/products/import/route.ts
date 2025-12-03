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

export async function POST(request: NextRequest) {
  try {
    // Check authentication - must be moderator or admin
    const session = await auth();
    if (!session?.user || session.user.role < ROLES.MODERATOR) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, quantity = 1, condition = "NEW", customDiscount } = body;

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
    if (!tcgProduct) {
      return NextResponse.json(
        { error: "Failed to fetch product data from TCGPlayer" },
        { status: 400 }
      );
    }

    // Get discount settings
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    const discountSettings: ImportSettings = customDiscount || {
      discountType: (settings?.discountType as "percentage" | "fixed") || "percentage",
      discountValue: settings?.discountValue ? Number(settings.discountValue) : 10,
    };

    // Get or determine price
    const originalPrice = tcgProduct.marketPrice || tcgProduct.listedPrice || 0;
    const ourPrice = calculateDiscountedPrice(originalPrice, discountSettings);

    // Find or create category (default to "Trading Cards")
    let category = await prisma.category.findUnique({
      where: { slug: "trading-cards" },
    });
    if (!category) {
      category = await prisma.category.create({
        data: { name: "Trading Cards", slug: "trading-cards" },
      });
    }

    // Find or create subType based on game
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
    let slug = baseSlug;
    let counter = 1;
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create the product
    const product = await prisma.product.create({
      data: {
        name: tcgProduct.name,
        slug,
        setName: tcgProduct.setName,
        cardNumber: tcgProduct.cardNumber,
        rarity: tcgProduct.rarity,
        image: tcgProduct.imageUrl,
        price: ourPrice,
        originalPrice: originalPrice,
        quantity,
        condition: condition as "NEW" | "USED",
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
      { error: "Failed to import product" },
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

    const tcgProduct = await fetchTCGPlayerProduct(url);
    if (!tcgProduct) {
      return NextResponse.json(
        { error: "Failed to fetch product data" },
        { status: 400 }
      );
    }

    // Get discount settings
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    const discountSettings: ImportSettings = {
      discountType: (settings?.discountType as "percentage" | "fixed") || "percentage",
      discountValue: settings?.discountValue ? Number(settings.discountValue) : 10,
    };

    const originalPrice = tcgProduct.marketPrice || tcgProduct.listedPrice || 0;
    const ourPrice = calculateDiscountedPrice(originalPrice, discountSettings);

    return NextResponse.json({
      preview: true,
      product: tcgProduct,
      priceInfo: {
        tcgPlayerPrice: originalPrice,
        ourPrice,
        discount: discountSettings,
        savings: originalPrice - ourPrice,
      },
    });
  } catch (error) {
    console.error("Preview error:", error);
    return NextResponse.json(
      { error: "Failed to preview product" },
      { status: 500 }
    );
  }
}

