import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        displayName: true,
        shippingName: true,
        shippingAddress: true,
        shippingCity: true,
        shippingState: true,
        shippingZip: true,
        shippingCountry: true,
        profileCompletedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const isComplete = !!(
      user.displayName &&
      user.shippingName &&
      user.shippingAddress &&
      user.shippingCity &&
      user.shippingState &&
      user.shippingZip &&
      user.shippingCountry
    );

    return NextResponse.json({
      isComplete,
      profile: {
        displayName: user.displayName,
        shippingName: user.shippingName,
        shippingAddress: user.shippingAddress,
        shippingCity: user.shippingCity,
        shippingState: user.shippingState,
        shippingZip: user.shippingZip,
        shippingCountry: user.shippingCountry,
      },
    });
  } catch (error) {
    console.error("Error checking profile:", error);
    return NextResponse.json(
      { error: "Failed to check profile" },
      { status: 500 }
    );
  }
}

