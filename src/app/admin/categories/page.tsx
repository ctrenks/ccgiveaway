import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminCategories() {
  const categories = await prisma.category.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  const subTypes = await prisma.subType.findMany({
    include: {
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Categories & Types</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">Categories</h2>
            <Link
              href="/admin/categories/new"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg"
            >
              + Add
            </Link>
          </div>

          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
              >
                <div>
                  <div className="text-white font-medium">{category.name}</div>
                  <div className="text-slate-500 text-sm">
                    {category._count.products} products
                  </div>
                </div>
                <Link
                  href={`/admin/categories/${category.id}`}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* SubTypes */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white">SubTypes (Games/Brands)</h2>
            <Link
              href="/admin/categories/subtypes/new"
              className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg"
            >
              + Add
            </Link>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {subTypes.map((subType) => (
              <div
                key={subType.id}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
              >
                <div>
                  <div className="text-white font-medium">{subType.name}</div>
                  <div className="text-slate-500 text-sm">
                    {subType._count.products} products
                  </div>
                </div>
                <Link
                  href={`/admin/categories/subtypes/${subType.id}`}
                  className="text-purple-400 hover:text-purple-300 text-sm"
                >
                  Edit
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

