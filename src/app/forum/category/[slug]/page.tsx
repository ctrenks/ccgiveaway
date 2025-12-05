import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatRelativeTime } from "@/lib/forum-utils";
import { ROLES } from "@/lib/constants";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function getCategory(slug: string) {
  const category = await prisma.forumCategory.findUnique({
    where: { slug, isActive: true },
  });
  return category;
}

async function getTopics(categoryId: string, page: number, limit: number) {
  const skip = (page - 1) * limit;

  const [topics, total] = await Promise.all([
    prisma.forumTopic.findMany({
      where: { categoryId },
      orderBy: [{ isPinned: "desc" }, { lastReplyAt: "desc" }],
      skip,
      take: limit,
      include: {
        _count: {
          select: { posts: true },
        },
      },
    }),
    prisma.forumTopic.count({ where: { categoryId } }),
  ]);

  // Get authors
  const topicsWithAuthors = await Promise.all(
    topics.map(async (topic) => {
      const author = await prisma.user.findUnique({
        where: { id: topic.authorId },
        select: { id: true, name: true, displayName: true, image: true },
      });
      return { ...topic, author };
    })
  );

  return {
    topics: topicsWithAuthors,
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = parseInt(pageStr || "1");
  const limit = 20;

  const session = await auth();
  const category = await getCategory(slug);

  if (!category) {
    notFound();
  }

  const { topics, total, totalPages } = await getTopics(category.id, page, limit);

  const canPost = session?.user && session.user.role !== ROLES.BANNED;

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
          <span className="text-white">{category.name}</span>
        </nav>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex items-center gap-4">
            {category.icon && <span className="text-4xl">{category.icon}</span>}
            <div>
              <h1 className="text-3xl font-bold text-white">{category.name}</h1>
              {category.description && (
                <p className="text-slate-400 mt-1">{category.description}</p>
              )}
              <p className="text-slate-500 text-sm mt-2">
                {total} {total === 1 ? "topic" : "topics"}
              </p>
            </div>
          </div>

          {canPost && (
            <Link
              href={`/forum/new-topic?category=${category.id}`}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all"
            >
              + New Topic
            </Link>
          )}
        </div>

        {/* Sign In Prompt */}
        {!session?.user && (
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6">
            <p className="text-blue-300">
              <Link href="/auth/signin" className="font-semibold underline hover:text-blue-200">
                Sign in
              </Link>{" "}
              to create topics and join the discussion.
            </p>
          </div>
        )}

        {/* Topics List */}
        {topics.length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <h2 className="text-xl font-bold text-white mb-2">No topics yet</h2>
            <p className="text-slate-400 mb-4">Be the first to start a discussion!</p>
            {canPost && (
              <Link
                href={`/forum/new-topic?category=${category.id}`}
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-xl transition-all"
              >
                Create First Topic
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden">
            {topics.map((topic, index) => (
              <Link
                key={topic.id}
                href={`/forum/topic/${topic.slug}`}
                className={`block p-6 hover:bg-slate-800/50 transition ${
                  index !== topics.length - 1 ? "border-b border-slate-800" : ""
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {topic.isPinned && (
                        <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">
                          📌 Pinned
                        </span>
                      )}
                      {topic.isLocked && (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                          🔒 Locked
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white hover:text-purple-400 transition">
                      {topic.title}
                    </h3>
                    <div className="text-sm text-slate-500 mt-2">
                      by{" "}
                      <span className="text-slate-300">
                        {topic.author?.displayName || topic.author?.name || "Unknown"}
                      </span>{" "}
                      • {formatRelativeTime(new Date(topic.createdAt))}
                    </div>
                  </div>

                  <div className="text-right text-sm text-slate-500 ml-4">
                    <div>
                      <span className="text-white font-medium">{topic._count.posts}</span>{" "}
                      {topic._count.posts === 1 ? "reply" : "replies"}
                    </div>
                    <div>
                      <span className="text-slate-400">{topic.viewCount}</span> views
                    </div>
                    {topic.lastReplyAt && (
                      <div className="text-xs text-slate-600 mt-1">
                        Last reply {formatRelativeTime(new Date(topic.lastReplyAt))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {page > 1 && (
              <Link
                href={`/forum/category/${slug}?page=${page - 1}`}
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
                href={`/forum/category/${slug}?page=${page + 1}`}
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

