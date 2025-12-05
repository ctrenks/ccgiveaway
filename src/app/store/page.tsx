import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

// Don't cache this page - always fetch fresh product data
export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getProducts(categorySlug?: string, subTypeId?: string) {
  const where: { active: boolean; category?: { slug: string }; subTypeId?: string } = { active: true };

  if (categorySlug) {
    where.category = { slug: categorySlug };
  }

  if (subTypeId) {
    where.subTypeId = subTypeId;
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true, subType: true },
    orderBy: { createdAt: "desc" },
  });
  return products;
}

async function getCategories() {
  // Only get categories that have at least one active product
  const categories = await prisma.category.findMany({
    where: {
      products: {
        some: {
          active: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });
  return categories;
}

async function getSubTypes() {
  // Only get subtypes that have at least one active product
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
        select: { products: { where: { active: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return subTypes;
}

async function getSettings() {
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });
  return settings;
}

// Calculate giveaway credits for a product
function getCreditsForProduct(
  product: { price: unknown; giveawayCredits: number | null },
  creditsPerDollar: number,
  creditsEnabled: boolean
): number {
  if (!creditsEnabled) return 0;
  // Use manual override if set
  if (product.giveawayCredits !== null) {
    return product.giveawayCredits;
  }
  // Otherwise calculate from price
  return Math.floor(Number(product.price) * creditsPerDollar);
}

interface PageProps {
  searchParams: Promise<{ category?: string; subtype?: string }>;
}

export default async function StorePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const categorySlug = params.category;
  const subTypeId = params.subtype;

  const [products, categories, subTypes, settings] = await Promise.all([
    getProducts(categorySlug, subTypeId),
    getCategories(),
    getSubTypes(),
    getSettings(),
  ]);

  const creditsPerDollar = settings?.giveawayCreditsPerDollar
    ? Number(settings.giveawayCreditsPerDollar)
    : 0.1;
  const creditsEnabled = settings?.giveawayCreditsEnabled ?? true;

  // Find current category name for display
  const currentCategory = categorySlug
    ? categories.find((c) => c.slug === categorySlug)
    : null;

  // Find current subtype for display
  const currentSubType = subTypeId
    ? subTypes.find((s) => s.id === subTypeId)
    : null;

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <span>/</span>
            <Link href="/store" className="hover:text-purple-400 transition-colors">Store</Link>
            {currentCategory && (
              <>
                <span>/</span>
                {currentSubType ? (
                  <Link href={`/store?category=${currentCategory.slug}`} className="hover:text-purple-400 transition-colors">
                    {currentCategory.name}
                  </Link>
                ) : (
                  <span className="text-white">{currentCategory.name}</span>
                )}
              </>
            )}
            {currentSubType && (
              <>
                <span>/</span>
                <span className="text-white">{currentSubType.name}</span>
              </>
            )}
          </nav>
          <h1 className="text-4xl font-bold text-white mb-4">
            {currentSubType ? currentSubType.name : currentCategory ? currentCategory.name : "Card Store"}
          </h1>
          <p className="text-slate-400 max-w-2xl">
            {currentSubType
              ? `Browse our ${currentSubType.name} collection.`
              : currentCategory
                ? `Browse our ${currentCategory.name.toLowerCase()} collection.`
                : "Browse our collection of rare and collectible trading cards. Find your next treasure from Magic: The Gathering, Pokémon, Yu-Gi-Oh!, and more."}
          </p>
        </div>

        {/* VIP Banner */}
        <div className="mb-8 p-4 bg-gradient-to-r from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">⭐</span>
              <div>
                <p className="text-white font-semibold">VIP Members save up to 7% on every order!</p>
                <p className="text-amber-200/70 text-sm">Plus free shipping and monthly giveaway credits.</p>
              </div>
            </div>
            <Link
              href="/subscribe"
              className="shrink-0 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold rounded-lg transition-all text-sm"
            >
              Join VIP →
            </Link>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Categories</h3>

              <div className="space-y-1">
                <Link
                  href="/store"
                  className={`flex items-center gap-3 transition-colors text-sm py-1 ${
                    !categorySlug && !subTypeId
                      ? "text-purple-400 font-medium"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  All Categories
                </Link>
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <Link
                      href={`/store?category=${cat.slug}`}
                      className={`flex items-center gap-3 transition-colors text-sm py-1 ${
                        categorySlug === cat.slug && !subTypeId
                          ? "text-purple-400 font-medium"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      {cat.name}
                    </Link>
                    {/* Show subtypes under the selected category */}
                    {subTypes.length > 0 && (
                      <div className="ml-4 space-y-1 mt-1">
                        {subTypes.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/store?category=${cat.slug}&subtype=${sub.id}`}
                            className={`flex items-center justify-between gap-2 transition-colors text-xs py-1 ${
                              subTypeId === sub.id
                                ? "text-purple-400 font-medium"
                                : "text-slate-400 hover:text-white"
                            }`}
                          >
                            <span>{sub.name}</span>
                            <span className="text-slate-600">({sub._count.products})</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-400">
                Showing <span className="text-white font-medium">{products.length}</span> products
                {currentSubType && (
                  <span> in {currentSubType.name}</span>
                )}
                {currentCategory && !currentSubType && (
                  <span> in {currentCategory.name}</span>
                )}
              </p>
              {(categorySlug || subTypeId) && (
                <Link
                  href="/store"
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  Clear filter ×
                </Link>
              )}
            </div>

            {/* Product Grid */}
            {products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🃏</div>
                <h2 className="text-2xl font-bold text-white mb-2">
                  {categorySlug || subTypeId ? "No products in this category" : "No products yet"}
                </h2>
                <p className="text-slate-400">
                  {categorySlug || subTypeId ? (
                    <Link href="/store" className="text-purple-400 hover:underline">
                      View all products
                    </Link>
                  ) : (
                    "Check back soon for new cards!"
                  )}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all"
                  >
                    {/* Image */}
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

                    {/* Details */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-white font-medium line-clamp-2">{product.name}</h3>
                      </div>

                      {product.setName && (
                        <p className="text-slate-500 text-sm mb-2">{product.setName}</p>
                      )}

                      <div className="flex items-center gap-2 mb-3">
                        {product.subType && (
                          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                            {product.subType.name}
                          </span>
                        )}
                        {product.condition && (
                          <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                            {product.condition}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xl font-bold text-white">
                            ${Number(product.price).toFixed(2)}
                          </span>
                          {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                            <span className="text-sm text-slate-500 line-through ml-2">
                              ${Number(product.originalPrice).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-slate-500">
                          {product.quantity} left
                        </span>
                      </div>

                      {/* Giveaway Credits */}
                      {creditsEnabled && (
                        <div className="flex items-center gap-1.5 mt-2 text-amber-400">
                          <span>🎁</span>
                          <span className="text-sm font-medium">
                            +{getCreditsForProduct(product, creditsPerDollar, creditsEnabled)} credits
                          </span>
                        </div>
                      )}

                      <AddToCartButton
                        product={{
                          id: product.id,
                          name: product.name,
                          price: Number(product.price),
                          image: product.image,
                          quantity: product.quantity,
                        }}
                        className="w-full mt-4"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
