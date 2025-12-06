import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        giveawayCredits: true,
        shippingName: true,
        shippingAddress: true,
        shippingCity: true,
        shippingState: true,
        shippingZip: true,
        shippingCountry: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      displayName,
      name,
      image,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
    } = body;

    // Check if displayName is unique (if provided)
    if (displayName) {
      const existing = await prisma.user.findFirst({
        where: {
          displayName,
          NOT: { id: session.user.id },
        },
      });

      if (existing) {
        return NextResponse.json(
          { error: "Display name is already taken" },
          { status: 400 }
        );
      }
    }

    // Build update data - only include fields that are explicitly provided
    const updateData: any = {};
    if (displayName !== undefined) updateData.displayName = displayName || null;
    if (name !== undefined) updateData.name = name;
    if (image !== undefined) updateData.image = image;
    if (shippingName !== undefined) updateData.shippingName = shippingName || null;
    if (shippingAddress !== undefined) updateData.shippingAddress = shippingAddress || null;
    if (shippingCity !== undefined) updateData.shippingCity = shippingCity || null;
    if (shippingState !== undefined) updateData.shippingState = shippingState || null;
    if (shippingZip !== undefined) updateData.shippingZip = shippingZip || null;
    if (shippingCountry !== undefined) updateData.shippingCountry = shippingCountry || null;

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        displayName: true,
        email: true,
        image: true,
        giveawayCredits: true,
        shippingName: true,
        shippingAddress: true,
        shippingCity: true,
        shippingState: true,
        shippingZip: true,
        shippingCountry: true,
      },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

