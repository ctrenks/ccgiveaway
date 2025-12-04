import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

async function getProducts() {
  const products = await prisma.product.findMany({
    where: { active: true, quantity: { gt: 0 } },
    include: { category: true, subType: true },
    orderBy: { createdAt: "desc" },
  });
  return products;
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });
  return categories;
}

export default async function StorePage() {
  const [products, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Store</span>
          </nav>
          <h1 className="text-4xl font-bold text-white mb-4">Card Store</h1>
          <p className="text-slate-400 max-w-2xl">
            Browse our collection of rare and collectible trading cards.
            Find your next treasure from Magic: The Gathering, Pokémon, Yu-Gi-Oh!, and more.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Category</h4>
                <div className="space-y-2">
                  <Link
                    href="/store"
                    className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors text-sm"
                  >
                    All Categories
                  </Link>
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/store?category=${cat.slug}`}
                      className="flex items-center gap-3 text-slate-300 hover:text-white transition-colors text-sm"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Count */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-400">
                Showing <span className="text-white font-medium">{products.length}</span> products
              </p>
            </div>

            {/* Product Grid */}
            {products.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🃏</div>
                <h2 className="text-2xl font-bold text-white mb-2">No products yet</h2>
                <p className="text-slate-400">Check back soon for new cards!</p>
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
