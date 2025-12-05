import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

// GET - Fetch single product
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role < ROLES.MODERATOR) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        subType: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Failed to fetch product" }, { status: 500 });
  }
}

// PUT - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role < ROLES.MODERATOR) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();

    const {
      name,
      description,
      image,
      price,
      originalPrice,
      quantity,
      setName,
      cardNumber,
      condition,
      rarity,
      categoryId,
      subTypeId,
      featured,
      active,
      giveawayCredits,
    } = body;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name,
        description,
        image,
        price,
        originalPrice,
        quantity,
        setName,
        cardNumber,
        condition,
        rarity,
        categoryId,
        subTypeId: subTypeId || null,
        featured,
        active,
        giveawayCredits,
      },
      include: {
        category: true,
        subType: true,
      },
    });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 });
  }
}

// DELETE - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role < ROLES.ADMIN) {
      return NextResponse.json({ error: "Unauthorized - Admin only" }, { status: 401 });
    }

    const { id } = await params;

    // First, delete order items from cancelled/refunded orders
    await prisma.orderItem.deleteMany({
      where: {
        productId: id,
        order: {
          status: { in: ["CANCELLED", "REFUNDED"] },
        },
      },
    });

    // Check if product still has order items from active orders
    const activeOrderItemCount = await prisma.orderItem.count({
      where: {
        productId: id,
        order: {
          status: { notIn: ["CANCELLED", "REFUNDED"] },
        },
      },
    });

    if (activeOrderItemCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete product with ${activeOrderItemCount} active order(s). Set it as inactive instead.` },
        { status: 400 }
      );
    }

    // Delete any remaining orphaned order items (shouldn't be any, but just in case)
    await prisma.orderItem.deleteMany({
      where: { productId: id },
    });

    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 });
  }
}
