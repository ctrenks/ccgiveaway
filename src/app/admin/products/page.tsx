"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  setName: string | null;
  cardNumber: string | null;
  image: string | null;
  price: string;
  originalPrice: string | null;
  quantity: number;
  active: boolean;
  isFoil: boolean;
  createdAt: Date;
  category: { id: string; name: string };
  subType: { id: string; name: string } | null;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [loadingValue, setLoadingValue] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch("/api/admin/products");
    const data = await res.json();
    
    // Sort: last 5 by date desc, then rest alphabetically
    const sorted = [...data.products].sort((a, b) => {
      const aDate = new Date(a.createdAt).getTime();
      const bDate = new Date(b.createdAt).getTime();
      
      // Get the 5th most recent date
      const dates = data.products.map((p: Product) => new Date(p.createdAt).getTime()).sort((x: number, y: number) => y - x);
      const fifthDate = dates[4] || 0;
      
      const aIsRecent = aDate >= fifthDate;
      const bIsRecent = bDate >= fifthDate;
      
      if (aIsRecent && bIsRecent) {
        // Both in top 5: sort by date desc
        return bDate - aDate;
      } else if (aIsRecent) {
        return -1; // a comes first
      } else if (bIsRecent) {
        return 1; // b comes first
      } else {
        // Both older: alphabetical
        return a.name.localeCompare(b.name);
      }
    });
    
    setProducts(sorted);
  };

  const calculateTotalValue = async () => {
    setLoadingValue(true);
    const res = await fetch("/api/admin/products/total-value");
    const data = await res.json();
    setTotalValue(data.totalValue);
    setLoadingValue(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold text-white">Products</h1>
          <button
            onClick={calculateTotalValue}
            disabled={loadingValue}
            className="px-3 py-1.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 text-white text-sm rounded-lg transition-colors"
          >
            {loadingValue ? "Calculating..." : "💰 Total Value"}
          </button>
          {totalValue !== null && (
            <span className="text-green-400 font-semibold">
              ${totalValue.toFixed(2)}
            </span>
          )}
        </div>
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
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{product.name}</span>
                          {product.isFoil && (
                            <span className="px-1.5 py-0.5 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-900 text-[10px] font-bold rounded">
                              ✨ FOIL
                            </span>
                          )}
                        </div>
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

