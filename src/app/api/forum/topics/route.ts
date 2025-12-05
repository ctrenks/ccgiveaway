import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createUniqueSlug } from "@/lib/forum-utils";
import { ROLES } from "@/lib/constants";

// GET - List topics (with optional category filter)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get("categoryId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [topics, total] = await Promise.all([
      prisma.forumTopic.findMany({
        where,
        orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }],
        skip,
        take: limit,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          _count: {
            select: { posts: true },
          },
        },
      }),
      prisma.forumTopic.count({ where }),
    ]);

    // Get author info
    const topicsWithAuthors = await Promise.all(
      topics.map(async (topic) => {
        const author = await prisma.user.findUnique({
          where: { id: topic.authorId },
          select: { id: true, name: true, displayName: true, image: true },
        });
        return { ...topic, author };
      })
    );

    return NextResponse.json({
      topics: topicsWithAuthors,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching topics:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

// POST - Create new topic
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is banned
    if (session.user.role === ROLES.BANNED) {
      return NextResponse.json(
        { error: "Your account is restricted from posting" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { categoryId, title, content } = body;

    if (!categoryId || !title || !content) {
      return NextResponse.json(
        { error: "Category, title, and content are required" },
        { status: 400 }
      );
    }

    // Verify category exists and is active
    const category = await prisma.forumCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.isActive) {
      return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    // Create unique slug
    const slug = createUniqueSlug(title);

    // Create topic and first post in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create topic
      const topic = await tx.forumTopic.create({
        data: {
          categoryId,
          authorId: session.user.id,
          title,
          slug,
          lastReplyAt: new Date(),
          lastReplyUserId: session.user.id,
        },
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
      });

      // Create first post
      await tx.forumPost.create({
        data: {
          topicId: topic.id,
          authorId: session.user.id,
          content,
        },
      });

      // Auto-follow the topic for the author
      await tx.forumTopicFollower.create({
        data: {
          topicId: topic.id,
          userId: session.user.id,
          emailNotifications: true,
        },
      });

      return topic;
    });

    return NextResponse.json({ topic: result }, { status: 201 });
  } catch (error) {
    console.error("Error creating topic:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}

