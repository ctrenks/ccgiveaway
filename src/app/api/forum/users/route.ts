import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Search users or get single user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const search = searchParams.get("search");

    // Get single user by ID
    if (id) {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
        },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      return NextResponse.json({ user });
    }

    // Search users
    if (search && search.length >= 2) {
      const users = await prisma.user.findMany({
        where: {
          AND: [
            {
              id: { not: session.user.id }, // Exclude self
            },
            {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { displayName: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          displayName: true,
          image: true,
        },
        take: 10,
      });

      return NextResponse.json({ users });
    }

    return NextResponse.json({ users: [] });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

