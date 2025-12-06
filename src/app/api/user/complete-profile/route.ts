import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const {
      displayName,
      shippingName,
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      shippingCountry,
    } = await request.json();

    // Validate required fields
    if (!displayName || !shippingName || !shippingAddress || !shippingCity || !shippingState || !shippingZip) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Validate USA only
    if (shippingCountry !== "US") {
      return NextResponse.json(
        { error: "We only ship to USA addresses at this time" },
        { status: 400 }
      );
    }

    // Check if displayName is already taken
    if (displayName !== session.user.name) {
      const existing = await prisma.user.findUnique({
        where: { displayName },
      });

      if (existing && existing.id !== session.user.id) {
        return NextResponse.json(
          { error: "This username is already taken" },
          { status: 400 }
        );
      }
    }

    // Update user profile
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        displayName,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingState: shippingState.toUpperCase(),
        shippingZip,
        shippingCountry,
        profileCompletedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      user: {
        displayName: user.displayName,
        profileCompleted: !!user.profileCompletedAt,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}

