import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role < ROLES.MODERATOR) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subTypes = await prisma.subType.findMany({
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ subTypes });
  } catch (error) {
    console.error("Error fetching subtypes:", error);
    return NextResponse.json({ error: "Failed to fetch subtypes" }, { status: 500 });
  }
}

