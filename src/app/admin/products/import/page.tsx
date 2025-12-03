"use client";

import { useState } from "react";
import Link from "next/link";

interface PreviewData {
  product: {
    name: string;
    setName?: string;
    cardNumber?: string;
    rarity?: string;
    imageUrl?: string;
    game: string;
  };
  priceInfo: {
    tcgPlayerPrice: number;
    ourPrice: number;
    discount: { discountType: string; discountValue: number };
    savings: number;
  };
}

export default function ImportProduct() {
  const [url, setUrl] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<"NEW" | "USED">("NEW");
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handlePreview = async () => {
    if (!url) return;
    setIsLoading(true);
    setError("");
    setPreview(null);

    try {
      const res = await fetch(`/api/products/import?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch product");
        return;
      }

      setPreview(data);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!url) return;
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, quantity, condition }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to import product");
        return;
      }

      setSuccess(`Successfully imported "${data.product.name}"!`);
      setUrl("");
      setPreview(null);
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="text-slate-400 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-white">Import from TCGPlayer</h1>
      </div>

      <div className="max-w-2xl">
        {/* URL Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            TCGPlayer Product URL
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tcgplayer.com/product/..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <button
              onClick={handlePreview}
              disabled={isLoading || !url}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
            >
              {isLoading ? "Loading..." : "Preview"}
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-2">
            Paste a TCGPlayer product URL to import card data automatically
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6 text-green-400">
            {success}
            <Link href="/admin/products" className="ml-2 underline">
              View Products
            </Link>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Preview</h2>

            <div className="flex gap-6">
              {/* Image */}
              {preview.product.imageUrl && (
                <div className="w-32 h-44 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={preview.product.imageUrl}
                    alt={preview.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="text-slate-500 text-sm">Name</div>
                  <div className="text-white font-medium">{preview.product.name}</div>
                </div>
                {preview.product.setName && (
                  <div>
                    <div className="text-slate-500 text-sm">Set</div>
                    <div className="text-white">{preview.product.setName}</div>
                  </div>
                )}
                {preview.product.rarity && (
                  <div>
                    <div className="text-slate-500 text-sm">Rarity</div>
                    <div className="text-white">{preview.product.rarity}</div>
                  </div>
                )}
                <div>
                  <div className="text-slate-500 text-sm">Game</div>
                  <div className="text-white capitalize">{preview.product.game}</div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h3 className="text-sm font-medium text-slate-400 mb-3">Pricing</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-500 text-xs">TCGPlayer Price</div>
                  <div className="text-white text-lg font-medium">
                    ${preview.priceInfo.tcgPlayerPrice.toFixed(2)}
                  </div>
                </div>
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <div className="text-green-400 text-xs">Your Price ({preview.priceInfo.discount.discountValue}% off)</div>
                  <div className="text-green-400 text-lg font-bold">
                    ${preview.priceInfo.ourPrice.toFixed(2)}
                  </div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-slate-500 text-xs">Savings</div>
                  <div className="text-amber-400 text-lg font-medium">
                    ${preview.priceInfo.savings.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>

            {/* Import Options */}
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as "NEW" | "USED")}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="NEW">New</option>
                  <option value="USED">Used</option>
                </select>
              </div>
            </div>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all"
            >
              {isLoading ? "Importing..." : "Import Product"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

