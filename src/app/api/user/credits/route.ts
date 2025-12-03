import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ credits: 0 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { giveawayCredits: true },
    });

    return NextResponse.json({ credits: user?.giveawayCredits ?? 0 });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return NextResponse.json({ credits: 0 });
  }
}

