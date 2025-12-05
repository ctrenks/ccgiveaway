import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isForumAdmin } from "@/lib/forum-utils";

// PATCH - Update post
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    const post = await prisma.forumPost.findUnique({
      where: { id },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAdmin = isForumAdmin(session.user.role);
    const isAuthor = post.authorId === session.user.id;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Only the author or admin can edit this post" },
        { status: 403 }
      );
    }

    const updatedPost = await prisma.forumPost.update({
      where: { id },
      data: {
        content,
        isEdited: true,
        editedAt: new Date(),
        editedBy: session.user.id,
      },
      include: {
        attachments: true,
      },
    });

    return NextResponse.json({ post: updatedPost });
  } catch (error) {
    console.error("Error updating post:", error);
    return NextResponse.json(
      { error: "Failed to update post" },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const post = await prisma.forumPost.findUnique({
      where: { id },
      include: {
        topic: {
          include: {
            posts: {
              where: { isDeleted: false },
              orderBy: { createdAt: "asc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const isAdmin = isForumAdmin(session.user.role);
    const isAuthor = post.authorId === session.user.id;

    if (!isAuthor && !isAdmin) {
      return NextResponse.json(
        { error: "Only the author or admin can delete this post" },
        { status: 403 }
      );
    }

    // Check if this is the first post (original post of the topic)
    const isFirstPost = post.topic.posts[0]?.id === post.id;

    if (isFirstPost) {
      return NextResponse.json(
        { error: "Cannot delete the original post. Delete the entire topic instead." },
        { status: 400 }
      );
    }

    // Soft delete the post
    await prisma.$transaction([
      prisma.forumPost.update({
        where: { id },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedBy: session.user.id,
        },
      }),
      // Decrement reply count
      prisma.forumTopic.update({
        where: { id: post.topicId },
        data: {
          replyCount: { decrement: 1 },
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting post:", error);
    return NextResponse.json(
      { error: "Failed to delete post" },
      { status: 500 }
    );
  }
}

