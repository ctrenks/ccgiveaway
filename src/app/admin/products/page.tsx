import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";

export default async function AdminProducts() {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      subType: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Products</h1>
        <div className="flex gap-3">
          <Link
            href="/admin/products/import"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          >
            🔗 Import from TCGPlayer
          </Link>
          <Link
            href="/admin/products/new"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
          >
            ➕ Add Product
          </Link>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-800/50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Product</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Price</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Stock</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-slate-400">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {products.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  No products yet. Add your first product!
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                        {product.image ? (
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            🃏
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="text-white font-medium">{product.name}</div>
                        <div className="text-slate-500 text-sm">
                          {product.setName && `${product.setName}`}
                          {product.cardNumber && ` #${product.cardNumber}`}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-slate-300">{product.category.name}</div>
                    {product.subType && (
                      <div className="text-slate-500 text-sm">{product.subType.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-green-400 font-medium">
                      ${Number(product.price).toFixed(2)}
                    </div>
                    {product.originalPrice && (
                      <div className="text-slate-500 text-sm line-through">
                        ${Number(product.originalPrice).toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`${
                        product.quantity > 0 ? "text-white" : "text-red-400"
                      }`}
                    >
                      {product.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        product.active
                          ? "bg-green-500/20 text-green-400"
                          : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      {product.active ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

