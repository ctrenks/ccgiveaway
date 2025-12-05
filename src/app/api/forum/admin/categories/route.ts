import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isForumAdmin, createSlug } from "@/lib/forum-utils";

// GET - Get all categories (including inactive)
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id || !isForumAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const categories = await prisma.forumCategory.findMany({
      orderBy: { displayOrder: "asc" },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    });

    return NextResponse.json({ categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST - Create new category
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id || !isForumAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, icon, displayOrder, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Category name is required" },
        { status: 400 }
      );
    }

    const slug = createSlug(name);

    // Check for duplicate slug
    const existing = await prisma.forumCategory.findUnique({
      where: { slug },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists" },
        { status: 400 }
      );
    }

    const category = await prisma.forumCategory.create({
      data: {
        name,
        slug,
        description: description || null,
        icon: icon || null,
        displayOrder: displayOrder || 0,
        isActive: isActive !== false,
      },
    });

    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

