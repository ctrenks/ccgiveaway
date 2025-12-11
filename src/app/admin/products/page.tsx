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
  tcgPlayerUrl: string | null;
  createdAt: Date;
  category: { id: string; name: string };
  subType: { id: string; name: string } | null;
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [loadingValue, setLoadingValue] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingQuantity, setUpdatingQuantity] = useState<string | null>(null);
  const [hoveredImage, setHoveredImage] = useState<string | null>(null);
  const [updatingProduct, setUpdatingProduct] = useState<string | null>(null);

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

  const updateQuantity = async (productId: string, delta: number) => {
    setUpdatingQuantity(productId);

    try {
      const product = products.find(p => p.id === productId);
      if (!product) return;

      const newQuantity = Math.max(0, product.quantity + delta);

      const res = await fetch(`/api/admin/products/${productId}/quantity`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (res.ok) {
        // Update local state
        setProducts(products.map(p =>
          p.id === productId ? { ...p, quantity: newQuantity } : p
        ));
      }
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setUpdatingQuantity(null);
    }
  };

  const updateProductNow = async (productId: string) => {
    if (!confirm("Update this product's prices and data from TCGPlayer now?")) {
      return;
    }

    setUpdatingProduct(productId);

    try {
      const res = await fetch(`/api/admin/products/${productId}/update-now`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok) {
        alert(
          `Product updated successfully!\n\n` +
          `Old Price: $${data.changes.oldPrice}\n` +
          `New Price: $${data.changes.newPrice}\n` +
          `\nTCGPlayer Prices:\n` +
          `Normal: $${data.changes.normalPrice || 'N/A'}\n` +
          `Foil: $${data.changes.foilPrice || 'N/A'}\n` +
          `\nUsed: ${data.changes.usedPrice?.toUpperCase()} price (isFoil: ${data.changes.isFoil})`
        );
        // Refresh products list
        fetchProducts();
      } else {
        alert(`Update failed: ${data.error}`);
      }
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product. Check console for details.");
    } finally {
      setUpdatingProduct(null);
    }
  };

  // Filter products based on search query
  const filteredProducts = products.filter(product => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) ||
      (product.setName && product.setName.toLowerCase().includes(query)) ||
      (product.cardNumber && product.cardNumber.toLowerCase().includes(query)) ||
      product.category.name.toLowerCase().includes(query) ||
      (product.subType && product.subType.name.toLowerCase().includes(query))
    );
  });

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

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search products by name, set, card number, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
            >
              ✕
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-sm text-slate-400">
            Found {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
          </p>
        )}
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
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                  {searchQuery ? `No products found matching "${searchQuery}"` : "No products yet. Add your first product!"}
                </td>
              </tr>
            ) : (
              filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0 relative cursor-pointer"
                        onMouseEnter={() => product.image && setHoveredImage(product.image)}
                        onMouseLeave={() => setHoveredImage(null)}
                      >
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
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        disabled={product.quantity === 0 || updatingQuantity === product.id}
                        className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-slate-800 text-white rounded transition-colors text-sm"
                        title="Decrease quantity"
                      >
                        −
                      </button>
                      <span
                        className={`min-w-[2rem] text-center font-medium ${
                          product.quantity > 0 ? "text-white" : "text-red-400"
                        }`}
                      >
                        {product.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        disabled={updatingQuantity === product.id}
                        className="w-6 h-6 flex items-center justify-center bg-slate-800 hover:bg-green-600 disabled:opacity-50 disabled:hover:bg-slate-800 text-white rounded transition-colors text-sm"
                        title="Increase quantity"
                      >
                        +
                      </button>
                    </div>
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
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => updateProductNow(product.id)}
                        disabled={updatingProduct === product.id}
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 text-white text-xs rounded transition-colors"
                        title="Update prices and data from TCGPlayer now"
                      >
                        {updatingProduct === product.id ? "⏳" : "🔄"} Update
                      </button>
                      <Link
                        href={`/admin/products/${product.id}`}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Image Preview Tooltip */}
      {hoveredImage && (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
          <div className="bg-slate-900 border-4 border-purple-500 rounded-2xl shadow-2xl overflow-hidden pointer-events-none">
            <Image
              src={hoveredImage}
              alt="Preview"
              width={400}
              height={560}
              className="object-contain"
              style={{ maxWidth: '400px', maxHeight: '560px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
