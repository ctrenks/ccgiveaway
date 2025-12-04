import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

export const dynamic = "force-dynamic";

// Icons for common game types
const gameIcons: Record<string, string> = {
  "magic the gathering": "🧙‍♂️",
  "pokemon": "⚡",
  "pokémon": "⚡",
  "yu-gi-oh": "👁️",
  "yu-gi-oh!": "👁️",
  "sports": "🏀",
  "sports cards": "🏀",
  "dragon ball": "🐉",
  "one piece": "🏴‍☠️",
  "flesh and blood": "⚔️",
  "disney lorcana": "✨",
  "toys": "🧸",
};

function getIcon(name: string): string {
  const lowered = name.toLowerCase();
  return gameIcons[lowered] || "🎴";
}

async function getSubTypesWithCounts() {
  const subTypes = await prisma.subType.findMany({
    where: {
      products: {
        some: {
          active: true,
        },
      },
    },
    include: {
      _count: {
        select: {
          products: {
            where: { active: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return subTypes;
}

async function getCategoriesWithCounts() {
  const categories = await prisma.category.findMany({
    where: {
      products: {
        some: {
          active: true,
        },
      },
    },
    include: {
      _count: {
        select: {
          products: {
            where: { active: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return categories;
}

export default async function CategoriesPage() {
  const [subTypes, categories] = await Promise.all([
    getSubTypesWithCounts(),
    getCategoriesWithCounts(),
  ]);

  const hasItems = subTypes.length > 0 || categories.length > 0;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Categories</span>
          </nav>
          <h1 className="text-4xl font-bold text-white mb-4">Browse by Category</h1>
          <p className="text-slate-400 max-w-2xl">
            Explore our collection organized by trading card game and category.
          </p>
        </div>

        {!hasItems ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🃏</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Products Yet</h2>
            <p className="text-slate-400 mb-6">
              We&apos;re adding new cards soon. Check back later!
            </p>
            <Link
              href="/store"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl"
            >
              Browse Store
            </Link>
          </div>
        ) : (
          <>
            {/* SubTypes (Card Games) */}
            {subTypes.length > 0 && (
              <section className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6">Card Games</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {subTypes.map((subType) => (
                    <Link
                      key={subType.id}
                      href={`/store?subtype=${subType.id}`}
                      className="group block"
                    >
                      <div className="relative h-48 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                        {/* Background */}
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                        {/* Content */}
                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                          <div className="text-4xl mb-2">{getIcon(subType.name)}</div>
                          <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                            {subType.name}
                          </h3>
                          <p className="text-sm text-purple-400 font-medium">
                            {subType._count.products} {subType._count.products === 1 ? "card" : "cards"} available
                          </p>
                        </div>

                        {/* Hover Arrow */}
                        <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Top-Level Categories */}
            {categories.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-white mb-6">Product Categories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {categories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/store?category=${category.slug}`}
                      className="group block"
                    >
                      <div className="relative h-40 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10">
                        {category.image ? (
                          <>
                            <Image
                              src={category.image}
                              alt={category.name}
                              fill
                              className="object-cover opacity-40 group-hover:opacity-60 transition-all duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                          </>
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                        )}

                        <div className="absolute inset-0 p-5 flex flex-col justify-end">
                          <div className="text-2xl mb-1">{getIcon(category.name)}</div>
                          <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                            {category.name}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {category._count.products} {category._count.products === 1 ? "item" : "items"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {/* Info Section */}
        <section className="mt-20 bg-gradient-to-br from-slate-900/50 to-purple-900/20 rounded-3xl border border-purple-500/10 p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Looking for Something Specific?</h2>
            <p className="text-slate-400 mb-8">
              Can&apos;t find what you&apos;re looking for? We&apos;re constantly adding new cards to our collection.
              Let us know what you&apos;re searching for and we&apos;ll help you find it!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/store"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                Browse All Cards
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
