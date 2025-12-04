import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ROLES } from "@/lib/constants";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user || (session.user.role ?? 0) < ROLES.ADMIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { amount, reason } = body;

    if (!amount || amount === 0) {
      return NextResponse.json({ error: "Amount is required" }, { status: 400 });
    }

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id },
      select: { giveawayCredits: true },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const balanceBefore = currentUser.giveawayCredits;
    const balanceAfter = Math.max(0, balanceBefore + amount); // Don't go below 0

    // Update user credits
    const user = await prisma.user.update({
      where: { id },
      data: { giveawayCredits: balanceAfter },
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

    // Try to create credit log (table may not exist yet)
    let log = null;
    try {
      log = await prisma.creditLog.create({
        data: {
          userId: id,
          amount,
          reason: reason || (amount > 0 ? "Manual credit addition" : "Manual credit removal"),
          adminId: session.user.id,
          adminEmail: session.user.email || null,
          balanceBefore,
          balanceAfter,
        },
      });
    } catch {
      // CreditLog table may not exist yet - that's okay
      console.log("CreditLog table not available, skipping log creation");
    }

    return NextResponse.json({ 
      user, 
      log: log || {
        id: "temp",
        amount,
        reason: reason || (amount > 0 ? "Manual credit addition" : "Manual credit removal"),
        balanceBefore,
        balanceAfter,
        createdAt: new Date().toISOString(),
        adminEmail: session.user.email,
      }
    });
  } catch (error) {
    console.error("Error adjusting credits:", error);
    return NextResponse.json(
      { error: "Failed to adjust credits" },
      { status: 500 }
    );
  }
}
