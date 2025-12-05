import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isForumAdmin, createSlug } from "@/lib/forum-utils";

// GET - Get single category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || !isForumAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const category = await prisma.forumCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error fetching category:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
      { status: 500 }
    );
  }
}

// PUT - Update category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || !isForumAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, icon, displayOrder, isActive } = body;

    const existing = await prisma.forumCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // If name changed, check for duplicate slug
    let newSlug = existing.slug;
    if (name && name !== existing.name) {
      newSlug = createSlug(name);
      const duplicate = await prisma.forumCategory.findFirst({
        where: {
          slug: newSlug,
          NOT: { id },
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }
    }

    const category = await prisma.forumCategory.update({
      where: { id },
      data: {
        name: name || existing.name,
        slug: newSlug,
        description: description !== undefined ? description : existing.description,
        icon: icon !== undefined ? icon : existing.icon,
        displayOrder: displayOrder !== undefined ? displayOrder : existing.displayOrder,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    });

    return NextResponse.json({ category });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE - Delete category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id || !isForumAdmin(session.user.role)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const category = await prisma.forumCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { topics: true },
        },
      },
    });

    if (!category) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if category has topics
    if (category._count.topics > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with existing topics. Move or delete topics first." },
        { status: 400 }
      );
    }

    await prisma.forumCategory.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}

