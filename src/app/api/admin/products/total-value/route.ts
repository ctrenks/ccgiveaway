import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      select: {
        price: true,
        quantity: true,
      },
    });

    const totalValue = products.reduce((sum, product) => {
      return sum + (Number(product.price) * product.quantity);
    }, 0);

    return NextResponse.json({ totalValue });
  } catch (error) {
    console.error("Error calculating total value:", error);
    return NextResponse.json({ error: "Failed to calculate total value" }, { status: 500 });
  }
}

