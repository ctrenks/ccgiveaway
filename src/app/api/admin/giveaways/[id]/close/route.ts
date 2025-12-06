import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

// Manual close for drawing (admin only)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const giveaway = await prisma.giveaway.findUnique({
    where: { id },
  });

  if (!giveaway) {
    return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  }

  if (giveaway.status !== "FILLING") {
    return NextResponse.json(
      { error: "Can only close FILLING giveaways" },
      { status: 400 }
    );
  }

  const updated = await prisma.giveaway.update({
    where: { id },
    data: { status: "CLOSED" },
  });

  return NextResponse.json({
    success: true,
    giveaway: updated,
  });
}

