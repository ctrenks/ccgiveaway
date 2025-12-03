import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const giveaways = await prisma.giveaway.findMany({
      where: {
        active: true,
        endDate: {
          gt: new Date(),
        },
      },
      include: {
        _count: {
          select: { entries: true },
        },
      },
      orderBy: {
        endDate: "asc",
      },
    });

    return NextResponse.json({ giveaways });
  } catch (error) {
    console.error("Error fetching giveaways:", error);
    return NextResponse.json(
      { error: "Failed to fetch giveaways" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { giveawayId, email, name } = body;

    if (!giveawayId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if giveaway exists and is active
    const giveaway = await prisma.giveaway.findUnique({
      where: { id: giveawayId },
    });

    if (!giveaway || !giveaway.active || new Date() > giveaway.endDate) {
      return NextResponse.json(
        { error: "Giveaway not found or has ended" },
        { status: 404 }
      );
    }

    // Check if already entered
    const existingEntry = await prisma.giveawayEntry.findUnique({
      where: {
        giveawayId_email: {
          giveawayId,
          email,
        },
      },
    });

    if (existingEntry) {
      return NextResponse.json(
        { error: "You have already entered this giveaway" },
        { status: 400 }
      );
    }

    // Create entry
    const entry = await prisma.giveawayEntry.create({
      data: {
        giveawayId,
        email,
        name,
      },
    });

    return NextResponse.json({ success: true, entry });
  } catch (error) {
    console.error("Error creating giveaway entry:", error);
    return NextResponse.json(
      { error: "Failed to enter giveaway" },
      { status: 500 }
    );
  }
}
