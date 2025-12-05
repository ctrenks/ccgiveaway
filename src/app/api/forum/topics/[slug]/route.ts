import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isForumAdmin } from "@/lib/forum-utils";

// GET - Get single topic with posts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const topic = await prisma.forumTopic.findUnique({
      where: { slug },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        _count: {
          select: { posts: true, followers: true },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    // Get author
    const author = await prisma.user.findUnique({
      where: { id: topic.authorId },
      select: { id: true, name: true, displayName: true, image: true, role: true },
    });

    // Increment view count
    await prisma.forumTopic.update({
      where: { id: topic.id },
      data: { viewCount: { increment: 1 } },
    });

    // Get posts with pagination
    const [posts, totalPosts] = await Promise.all([
      prisma.forumPost.findMany({
        where: {
          topicId: topic.id,
          isDeleted: false,
        },
        orderBy: { createdAt: "asc" },
        skip,
        take: limit,
        include: {
          attachments: true,
        },
      }),
      prisma.forumPost.count({
        where: {
          topicId: topic.id,
          isDeleted: false,
        },
      }),
    ]);

    // Get authors for posts
    const postsWithAuthors = await Promise.all(
      posts.map(async (post) => {
        const postAuthor = await prisma.user.findUnique({
          where: { id: post.authorId },
          select: { id: true, name: true, displayName: true, image: true, role: true },
        });
        return { ...post, author: postAuthor };
      })
    );

    return NextResponse.json({
      topic: { ...topic, author },
      posts: postsWithAuthors,
      pagination: {
        page,
        limit,
        total: totalPosts,
        totalPages: Math.ceil(totalPosts / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching topic:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic" },
      { status: 500 }
    );
  }
}

// PATCH - Update topic (admin: pin/lock, author: edit title)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { slug } = await params;
    const body = await request.json();
    const { title, isPinned, isLocked } = body;

    const topic = await prisma.forumTopic.findUnique({
      where: { slug },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    const isAdmin = isForumAdmin(session.user.role);
    const isAuthor = topic.authorId === session.user.id;

    // Only admin can pin/lock
    if ((isPinned !== undefined || isLocked !== undefined) && !isAdmin) {
      return NextResponse.json(
        { error: "Only admins can pin or lock topics" },
        { status: 403 }
      );
    }

    // Only author or admin can edit title
    if (title !== undefined && !isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Only the author or admin can edit the title" },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (isPinned !== undefined) updateData.isPinned = isPinned;
    if (isLocked !== undefined) updateData.isLocked = isLocked;

    const updatedTopic = await prisma.forumTopic.update({
      where: { id: topic.id },
      data: updateData,
    });

    return NextResponse.json({ topic: updatedTopic });
  } catch (error) {
    console.error("Error updating topic:", error);
    return NextResponse.json(
      { error: "Failed to update topic" },
      { status: 500 }
    );
  }
}

// DELETE - Delete topic (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!isForumAdmin(session.user.role)) {
      return NextResponse.json(
        { error: "Only admins can delete topics" },
        { status: 403 }
      );
    }

    const { slug } = await params;

    const topic = await prisma.forumTopic.findUnique({
      where: { slug },
    });

    if (!topic) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    await prisma.forumTopic.delete({
      where: { id: topic.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting topic:", error);
    return NextResponse.json(
      { error: "Failed to delete topic" },
      { status: 500 }
    );
  }
}

