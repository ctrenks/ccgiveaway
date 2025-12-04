import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

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

    const subType = await prisma.subType.findUnique({
      where: { id },
    });

    if (!subType) {
      return NextResponse.json({ error: "SubType not found" }, { status: 404 });
    }

    return NextResponse.json({ subType });
  } catch (error) {
    console.error("Error fetching subtype:", error);
    return NextResponse.json({ error: "Failed to fetch subtype" }, { status: 500 });
  }
}

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
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const subType = await prisma.subType.update({
      where: { id },
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json({ subType });
  } catch (error) {
    console.error("Error updating subtype:", error);
    return NextResponse.json({ error: "Failed to update subtype" }, { status: 500 });
  }
}

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

    // Remove subType from products (set to null)
    await prisma.product.updateMany({
      where: { subTypeId: id },
      data: { subTypeId: null },
    });

    await prisma.subType.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting subtype:", error);
    return NextResponse.json({ error: "Failed to delete subtype" }, { status: 500 });
  }
}

