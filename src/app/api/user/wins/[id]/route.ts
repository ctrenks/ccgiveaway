import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const win = await prisma.giveawayWinner.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      giveaway: {
        select: {
          title: true,
          image: true,
        },
      },
    },
  });

  if (!win) {
    return NextResponse.json({ error: "Win not found" }, { status: 404 });
  }

  return NextResponse.json({ win });
}

