import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const giveaways = await prisma.giveaway.findMany({
    where: {
      status: {
        in: ["OPEN", "FILLING", "CLOSED"],
      },
    },
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { picks: true },
      },
    },
  });

  return NextResponse.json({ giveaways });
}
