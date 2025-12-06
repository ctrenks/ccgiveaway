import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fingerprint } = await request.json();

    if (!fingerprint) {
      return NextResponse.json(
        { error: "Fingerprint is required" },
        { status: 400 }
      );
    }

    // Get IP and user agent from headers
    const forwarded = request.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0] : request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Check if this device is used by other accounts
    const existingDevices = await prisma.deviceFingerprint.findMany({
      where: {
        fingerprint,
        userId: { not: session.user.id },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    const hasMultipleAccounts = existingDevices.length > 0;

    if (hasMultipleAccounts) {
      console.warn(`Multi-account detected: Device ${fingerprint.substring(0, 8)} used by ${existingDevices.length + 1} accounts`);
    }

    // Track or update this user's device
    await prisma.deviceFingerprint.upsert({
      where: {
        userId_fingerprint: {
          userId: session.user.id,
          fingerprint,
        },
      },
      create: {
        userId: session.user.id,
        fingerprint,
        ipAddress,
        userAgent,
      },
      update: {
        lastSeen: new Date(),
        ipAddress,
        userAgent,
      },
    });

    return NextResponse.json({
      tracked: true,
      multipleAccountsDetected: hasMultipleAccounts,
      deviceCount: existingDevices.length + 1,
    });
  } catch (error) {
    console.error("Error tracking device:", error);
    return NextResponse.json(
      { error: "Failed to track device" },
      { status: 500 }
    );
  }
}

