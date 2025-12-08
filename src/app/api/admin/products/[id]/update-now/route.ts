import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";
import {
  fetchTCGPlayerProductWithPrices,
  calculateDiscountedPrice,
  type ImportSettings,
} from "@/lib/tcgplayer";

// Manual product update - admin can trigger immediate price/data sync
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role < ROLES.MODERATOR) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get the product
    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (!product.tcgPlayerUrl) {
      return NextResponse.json(
        { error: "Product has no TCGPlayer URL" },
        { status: 400 }
      );
    }

    // Fetch updated data and prices
    console.log(`Manual update triggered for: ${product.name}`);
    const tcgProduct = await fetchTCGPlayerProductWithPrices(product.tcgPlayerUrl);

    if (!tcgProduct) {
      return NextResponse.json(
        { error: "Failed to fetch product data from TCGPlayer" },
        { status: 500 }
      );
    }

    // Get discount settings
    const settings = await prisma.settings.findUnique({ where: { id: "default" } });
    const discountSettings: ImportSettings = {
      discountType: (settings?.discountType as "percentage" | "fixed") || "percentage",
      discountValue: settings?.discountValue ? Number(settings.discountValue) : 10,
    };

    // Calculate new price based on foil status
    const originalPrice = product.isFoil
      ? (tcgProduct.foilPrice || tcgProduct.marketPrice || 0)
      : (tcgProduct.marketPrice || tcgProduct.foilPrice || 0);

    const newPrice = originalPrice > 0 
      ? calculateDiscountedPrice(originalPrice, discountSettings)
      : Number(product.price);

    // Update product with all new data
    const updated = await prisma.product.update({
      where: { id },
      data: {
        originalPrice: originalPrice || product.originalPrice,
        price: newPrice,
        cardNumber: tcgProduct.cardNumber || product.cardNumber,
        cardType: tcgProduct.cardType || product.cardType,
        description: tcgProduct.description || product.description,
        legality: tcgProduct.legality || product.legality,
        artist: tcgProduct.artist || product.artist,
        manaCost: tcgProduct.manaCost || product.manaCost,
        powerToughness: tcgProduct.powerToughness || product.powerToughness,
        rarity: tcgProduct.rarity || product.rarity,
        image: tcgProduct.imageUrl || product.image,
        lastPriceSync: new Date(),
      },
      include: {
        category: true,
        subType: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Product updated successfully",
      product: updated,
      changes: {
        oldPrice: Number(product.price),
        newPrice: Number(updated.price),
        normalPrice: tcgProduct.marketPrice,
        foilPrice: tcgProduct.foilPrice,
      },
    });
  } catch (error) {
    console.error("Manual update error:", error);
    return NextResponse.json(
      {
        error: `Failed to update product: ${error instanceof Error ? error.message : "Unknown error"}`,
      },
      { status: 500 }
    );
  }
}

