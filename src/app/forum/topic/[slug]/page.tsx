import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import TopicView from "./TopicView";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getTopic(slug: string) {
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

  if (!topic) return null;

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

  return { ...topic, author };
}

async function getPosts(topicId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    prisma.forumPost.findMany({
      where: {
        topicId,
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
        topicId,
        isDeleted: false,
      },
    }),
  ]);

  // Get authors
  const postsWithAuthors = await Promise.all(
    posts.map(async (post) => {
      const author = await prisma.user.findUnique({
        where: { id: post.authorId },
        select: { id: true, name: true, displayName: true, image: true, role: true },
      });
      return { ...post, author };
    })
  );

  return {
    posts: postsWithAuthors,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export default async function TopicPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1");
  const limit = 20;

  const session = await auth();
  const topic = await getTopic(slug);

  if (!topic) {
    notFound();
  }

  const { posts, total, totalPages } = await getPosts(topic.id, page, limit);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/forum" className="hover:text-purple-400 transition-colors">
            Forum
          </Link>
          <span>/</span>
          <Link
            href={`/forum/category/${topic.category.slug}`}
            className="hover:text-purple-400 transition-colors"
          >
            {topic.category.name}
          </Link>
          <span>/</span>
          <span className="text-white truncate max-w-xs">{topic.title}</span>
        </nav>

        {/* Topic Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            {topic.isPinned && (
              <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded">
                📌 Pinned
              </span>
            )}
            {topic.isLocked && (
              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
                🔒 Locked
              </span>
            )}
          </div>
          <h1 className="text-3xl font-bold text-white">{topic.title}</h1>
          <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
            <span>
              {topic._count.posts} {topic._count.posts === 1 ? "reply" : "replies"}
            </span>
            <span>•</span>
            <span>{topic.viewCount} views</span>
            <span>•</span>
            <span>{topic._count.followers} following</span>
          </div>
        </div>

        {/* Topic Content */}
        <TopicView
          topic={topic}
          posts={posts}
          pagination={{ page, total, totalPages }}
          session={session}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/forum/topic/${slug}?page=${page - 1}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                ← Previous
              </Link>
            )}
            <span className="px-4 py-2 text-slate-400">
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link
                href={`/forum/topic/${slug}?page=${page + 1}`}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

