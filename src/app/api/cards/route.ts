import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category");
    const rarity = searchParams.get("rarity");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = { slug: category };
    }

    if (rarity) {
      where.rarity = rarity;
    }

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) (where.price as Record<string, unknown>).gte = parseFloat(minPrice);
      if (maxPrice) (where.price as Record<string, unknown>).lte = parseFloat(maxPrice);
    }

    const orderBy: Record<string, string> = {};
    switch (sort) {
      case "price-low":
        orderBy.price = "asc";
        break;
      case "price-high":
        orderBy.price = "desc";
        break;
      case "name":
        orderBy.name = "asc";
        break;
      default:
        orderBy.createdAt = "desc";
    }

    const [cards, total] = await Promise.all([
      prisma.card.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
        },
      }),
      prisma.card.count({ where }),
    ]);

    return NextResponse.json({
      cards,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching cards:", error);
    return NextResponse.json(
      { error: "Failed to fetch cards" },
      { status: 500 }
    );
  }
}
