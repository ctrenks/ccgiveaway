import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/types/next-auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role < ROLES.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.settings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    console.error("Settings fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role < ROLES.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      discountType,
      discountValue,
      autoSyncEnabled,
      syncIntervalDays,
      giveawayCreditsPerDollar,
      giveawayCreditsEnabled,
    } = body;

    const settings = await prisma.settings.upsert({
      where: { id: "default" },
      update: {
        discountType,
        discountValue,
        autoSyncEnabled,
        syncIntervalDays,
        giveawayCreditsPerDollar,
        giveawayCreditsEnabled,
      },
      create: {
        id: "default",
        discountType,
        discountValue,
        autoSyncEnabled,
        syncIntervalDays,
        giveawayCreditsPerDollar,
        giveawayCreditsEnabled,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("Settings save error:", error);
    return NextResponse.json({ error: "Failed to save settings" }, { status: 500 });
  }
}

