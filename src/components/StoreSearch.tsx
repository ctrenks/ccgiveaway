"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import AddToCartButton from "@/components/AddToCartButton";

interface Product {
  id: string;
  name: string;
  image: string | null;
  price: string;
  originalPrice: string | null;
  quantity: number;
  setName: string | null;
  condition: string | null;
  isFoil: boolean;
  subType: { id: string; name: string } | null;
}

interface StoreSearchProps {
  products: Product[];
  creditsPerDollar: number;
  creditsEnabled: boolean;
}

function getCreditsForProduct(
  product: { price: string; giveawayCredits?: number | null },
  creditsPerDollar: number,
  creditsEnabled: boolean
): number {
  if (!creditsEnabled) return 0;
  if (product.giveawayCredits !== undefined && product.giveawayCredits !== null) {
    return product.giveawayCredits;
  }
  const calculated = Math.floor(Number(product.price) * creditsPerDollar);
  return Math.max(1, calculated);
}

export default function StoreSearch({ products, creditsPerDollar, creditsEnabled }: StoreSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      (product.setName && product.setName.toLowerCase().includes(query)) ||
      (product.subType && product.subType.name.toLowerCase().includes(query))
    );
  }, [products, searchQuery]);

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search cards by name, set, or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pl-12 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
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
            Found {filteredProducts.length} {filteredProducts.length === 1 ? 'card' : 'cards'}
          </p>
        )}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="col-span-full text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-slate-400 text-lg">No cards found matching "{searchQuery}"</p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-4 text-purple-400 hover:text-purple-300 transition-colors"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden group hover:border-purple-500/30 transition-all flex flex-col h-full"
            >
              {/* Image */}
              <div className="aspect-[3/4] bg-slate-800 relative overflow-hidden">
                {product.image ? (
                  <>
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {/* Foil Glare Effect */}
                    {product.isFoil && (
                      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/20 to-transparent opacity-30 group-hover:opacity-50 transition-opacity pointer-events-none"
                        style={{
                          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.1) 25%, rgba(255,215,0,0.3) 50%, rgba(255,255,255,0.1) 75%, transparent 100%)',
                          backgroundSize: '200% 200%',
                          animation: 'foil-glare 3s ease-in-out infinite',
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    🃏
                  </div>
                )}
                
                {/* Foil Badge */}
                {product.isFoil && (
                  <div className="absolute top-3 left-3 bg-gradient-to-r from-amber-400 to-yellow-300 text-slate-900 text-xs font-bold px-2 py-1 rounded shadow-lg">
                    ✨ FOIL
                  </div>
                )}
                
                {/* Discount Badge */}
                {product.originalPrice && Number(product.originalPrice) > Number(product.price) && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    {Math.round((1 - Number(product.price) / Number(product.originalPrice)) * 100)}% OFF
                  </div>
                )}
              </div>

              {/* Details */}
              <div className="p-4 flex flex-col flex-1">
                {/* Title */}
                <h3 className="text-white font-medium line-clamp-2 h-12 mb-2">{product.name}</h3>

                {/* Set name */}
                <p className="text-slate-500 text-sm h-5 mb-2 truncate">
                  {product.setName || "\u00A0"}
                </p>

                {/* Tags */}
                <div className="flex items-center gap-2 h-6 mb-3">
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

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Price row */}
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
    </>
  );
}

