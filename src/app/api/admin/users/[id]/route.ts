import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          orders: {
            where: {
              status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
            },
          },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get credit logs (may not exist if migration not run)
  let creditLogs: unknown[] = [];
  try {
    creditLogs = await prisma.creditLog.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  } catch {
    // CreditLog table may not exist yet
  }

  return NextResponse.json({ user, creditLogs });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();

  if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { email, role } = body;

  // Validate role
  if (role !== undefined && ![0, 1, 5, 9].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Check if email is already in use by another user
  if (email) {
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id },
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already in use by another user" },
        { status: 400 }
      );
    }
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
    },
    include: {
      _count: {
        select: {
          orders: {
            where: {
              status: { in: ["PAID", "PROCESSING", "SHIPPED", "DELIVERED"] },
            },
          },
        },
      },
    },
  });

  return NextResponse.json({ user });
}
