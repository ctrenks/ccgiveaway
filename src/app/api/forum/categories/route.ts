import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - List all active categories (public)
export async function GET() {
  try {
    const categories = await prisma.forumCategory.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { topics: true },
        },
        topics: {
          where: {
            isLocked: false,
          },
          orderBy: {
            lastReplyAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            title: true,
            lastReplyAt: true,
            lastReplyUserId: true,
            authorId: true,
          },
        },
      },
    });

    // Get author info for latest topics
    const categoriesWithAuthors = await Promise.all(
      categories.map(async (cat) => {
        if (cat.topics[0]) {
          const author = await prisma.user.findUnique({
            where: { id: cat.topics[0].authorId },
            select: { id: true, name: true, displayName: true, image: true },
          });
          return {
            ...cat,
            topics: [{ ...cat.topics[0], author }],
          };
        }
        return cat;
      })
    );

    return NextResponse.json({ categories: categoriesWithAuthors });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

