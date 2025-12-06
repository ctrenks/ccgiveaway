import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { quantity } = await request.json();

  if (typeof quantity !== "number" || quantity < 0) {
    return NextResponse.json(
      { error: "Quantity must be a non-negative number" },
      { status: 400 }
    );
  }

  try {
    const product = await prisma.product.update({
      where: { id },
      data: { quantity },
    });

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        quantity: product.quantity,
      },
    });
  } catch (error) {
    console.error("Error updating product quantity:", error);
    return NextResponse.json(
      { error: "Failed to update quantity" },
      { status: 500 }
    );
  }
}

