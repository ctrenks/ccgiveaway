import { Hero } from "@/components/Hero";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { unstable_cache } from "next/cache";
import AddToCartButton from "@/components/AddToCartButton";

// Cache for 2 hours (7200 seconds)
const getHeroCardImages = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        image: { not: null },
      },
      select: { image: true },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
    return products.map((p) => p.image).filter((img): img is string => img !== null);
  },
  ["hero-card-images"],
  { revalidate: 7200 }
);

// Cache for 2 hours
const getSubTypesWithCounts = unstable_cache(
  async () => {
    const subTypes = await prisma.subType.findMany({
      where: {
        products: {
          some: { active: true },
        },
      },
      include: {
        _count: {
          select: { products: { where: { active: true } } },
        },
      },
      orderBy: { name: "asc" },
      take: 4,
    });
    return subTypes;
  },
  ["homepage-subtypes"],
  { revalidate: 7200 }
);

// Cache for 1 hour
const getFeaturedProducts = unstable_cache(
  async () => {
    const products = await prisma.product.findMany({
      where: {
        active: true,
        quantity: { gt: 0 },
      },
      include: {
        category: true,
        subType: true,
      },
      orderBy: { createdAt: "desc" },
      take: 4,
    });
    return products;
  },
  ["homepage-featured"],
  { revalidate: 3600 }
);

const gameIcons: Record<string, string> = {
  "magic the gathering": "🧙‍♂️",
  "pokemon": "⚡",
  "pokémon": "⚡",
  "yu-gi-oh": "👁️",
  "yu-gi-oh!": "👁️",
  "sports": "🏀",
  "sports cards": "🏀",
};

function getIcon(name: string): string {
  return gameIcons[name.toLowerCase()] || "🎴";
}

export default async function HomePage() {
  const [cardImages, subTypes, featuredProducts] = await Promise.all([
    getHeroCardImages(),
    getSubTypesWithCounts(),
    getFeaturedProducts(),
  ]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero cardImages={cardImages} />

      {/* Categories Section */}
      {subTypes.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Browse Categories</h2>
              <p className="text-slate-400">Explore our collection by card type</p>
            </div>
            <Link
              href="/categories"
              className="hidden sm:flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              View All
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {subTypes.map((subType) => (
              <Link
                key={subType.id}
                href={`/store?subtype=${subType.id}`}
                className="group block"
              >
                <div className="relative h-48 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    <div className="text-4xl mb-2">{getIcon(subType.name)}</div>
                    <h3 className="text-xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
                      {subType.name}
                    </h3>
                    <p className="text-sm text-purple-400 font-medium">
                      {subType._count.products} cards available
                    </p>
                  </div>
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

      {/* Featured Cards Section */}
      {featuredProducts.length > 0 && (
        <section className="bg-gradient-to-b from-transparent via-purple-950/20 to-transparent py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">Featured Cards</h2>
                <p className="text-slate-400">Fresh additions to our collection</p>
              </div>
              <Link
                href="/store"
                className="hidden sm:flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
              >
                View Store
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all"
                >
                  <div className="aspect-[3/4] bg-slate-800 relative overflow-hidden">
                    {product.image ? (
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl">
                        🃏
                      </div>
                    )}
                    {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                        {Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100)}% OFF
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-white font-medium line-clamp-2 mb-1">{product.name}</h3>
                    {product.setName && (
                      <p className="text-slate-500 text-sm mb-2">{product.setName}</p>
                    )}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xl font-bold text-white">
                        ${Number(product.price).toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500">
                        {product.quantity} left
                      </span>
                    </div>
                    <AddToCartButton
                      product={{
                        id: product.id,
                        name: product.name,
                        price: Number(product.price),
                        image: product.image,
                        quantity: product.quantity,
                      }}
                      className="w-full"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Giveaway CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-3xl p-8 md:p-12 border border-purple-500/20">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
                <span className="text-2xl">🎁</span>
                <span className="text-sm font-medium text-white">Weekly Giveaways</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Win Rare Cards Every Week!
              </h2>
              <p className="text-slate-300 max-w-lg">
                Enter our exclusive giveaways for a chance to win rare and valuable collector cards.
                New giveaways every week – it&apos;s free to enter!
              </p>
            </div>
            <Link
              href="/giveaways"
              className="shrink-0 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center gap-2 text-lg"
            >
              <span>Enter Now</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-slate-900/50 py-20 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay in the Loop</h2>
          <p className="text-slate-400 mb-8">
            Get notified about new arrivals, exclusive deals, and upcoming giveaways.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
