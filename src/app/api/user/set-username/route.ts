import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { username } = await request.json();

  if (!username || typeof username !== "string") {
    return NextResponse.json({ error: "Username is required" }, { status: 400 });
  }

  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
  }

  if (trimmed.length > 20) {
    return NextResponse.json({ error: "Username must be 20 characters or less" }, { status: 400 });
  }

  // Check if username is already taken
  const existing = await prisma.user.findFirst({
    where: {
      displayName: trimmed,
      id: { not: session.user.id },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 400 });
  }

  // Update user
  await prisma.user.update({
    where: { id: session.user.id },
    data: { displayName: trimmed },
  });

  return NextResponse.json({ success: true });
}

