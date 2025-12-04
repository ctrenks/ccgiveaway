"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";

export default function CartPage() {
  const { items, updateQuantity, removeItem, total, itemCount } = useCart();
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 100,
    flatShippingRate: 5,
  });

  // Load shipping settings
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setShippingSettings({
            freeShippingThreshold: Number(data.settings.freeShippingThreshold) || 100,
            flatShippingRate: Number(data.settings.flatShippingRate) || 5,
          });
        }
      })
      .catch(() => {});
  }, []);

  const shippingCost = total >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.flatShippingRate;
  const orderTotal = total + shippingCost;
  const amountToFreeShipping = shippingSettings.freeShippingThreshold - total;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="text-6xl mb-6">🛒</div>
          <h1 className="text-3xl font-bold text-white mb-4">Your Cart is Empty</h1>
          <p className="text-slate-400 mb-8">
            Looks like you haven&apos;t added any cards yet.
          </p>
          <Link
            href="/store"
            className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all"
          >
            Browse Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">
          Your Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4"
              >
                {/* Image */}
                <div className="w-20 h-28 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={80}
                      height={112}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">
                      🃏
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">{item.name}</h3>
                  <p className="text-purple-400 font-bold">${item.price.toFixed(2)}</p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-slate-800 hover:bg-slate-700 text-white rounded-lg flex items-center justify-center transition-colors"
                    >
                      -
                    </button>
                    <span className="text-white font-medium w-8 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.maxQuantity}
                      className="w-8 h-8 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                    <span className="text-slate-500 text-sm">
                      ({item.maxQuantity} available)
                    </span>
                  </div>
                </div>

                {/* Subtotal & Remove */}
                <div className="text-right">
                  <p className="text-white font-bold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-400 hover:text-red-300 text-sm mt-2 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Shipping</span>
                  {shippingCost === 0 ? (
                    <span className="text-green-400">Free</span>
                  ) : (
                    <span>${shippingCost.toFixed(2)}</span>
                  )}
                </div>
                {shippingCost > 0 && amountToFreeShipping > 0 && (
                  <p className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">
                    🚚 Add ${amountToFreeShipping.toFixed(2)} more for FREE shipping!
                  </p>
                )}
                <div className="border-t border-slate-800 pt-3 flex justify-between text-white font-bold text-lg">
                  <span>Total</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <Link
                href="/checkout"
                className="block w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl text-center transition-all"
              >
                Proceed to Checkout
              </Link>

              <Link
                href="/store"
                className="block w-full py-3 mt-3 border border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-white rounded-xl text-center transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
