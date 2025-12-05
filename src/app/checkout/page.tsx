"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/lib/cart";

type PaymentMethod = "paypal" | null;

export default function CheckoutPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { items, total, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");

  // Shipping settings
  const [shippingSettings, setShippingSettings] = useState({
    freeShippingThreshold: 100,
    flatShippingRate: 5,
  });

  // Shipping form
  const [shipping, setShipping] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zip: "",
    country: "US",
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

  // Load saved shipping info
  useEffect(() => {
    if (session?.user?.id) {
      fetch("/api/user/profile")
        .then((res) => res.json())
        .then((data) => {
          if (data.user?.shippingAddress) {
            try {
              const saved = JSON.parse(data.user.shippingAddress);
              setShipping(saved);
            } catch {
              // Invalid JSON, ignore
            }
          }
          if (data.user?.name) {
            setShipping((prev) => ({ ...prev, name: prev.name || data.user.name }));
          }
        })
        .catch(() => {});
    }
  }, [session?.user?.id]);

  // Calculate shipping cost
  const shippingCost = total >= shippingSettings.freeShippingThreshold ? 0 : shippingSettings.flatShippingRate;
  const orderTotal = total + shippingCost;

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin?callbackUrl=/checkout");
    }
  }, [status, router]);

  // Redirect if cart is empty
  useEffect(() => {
    if (items.length === 0 && status !== "loading") {
      router.push("/cart");
    }
  }, [items.length, status, router]);

  const handlePayPal = async () => {
    setIsProcessing(true);
    setError("");

    try {
      const res = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((item) => ({
            id: item.id,
            quantity: item.quantity,
          })),
          shipping,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create PayPal order");
      }

      // Redirect to PayPal
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
      setIsProcessing(false);
    }
  };

  const isShippingComplete =
    shipping.name &&
    shipping.address &&
    shipping.city &&
    shipping.state &&
    shipping.zip &&
    shipping.country;

  if (status === "loading" || items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12">
      <div className="max-w-5xl mx-auto px-4">
        <Link href="/cart" className="text-slate-400 hover:text-white mb-6 inline-block">
          ← Back to Cart
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Checkout</h1>

        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Shipping & Payment */}
          <div className="space-y-6">
            {/* Shipping */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Shipping Address</h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full">
                  <span className="text-blue-400">🇺🇸</span>
                  <span className="text-blue-300 text-xs font-medium">USA Only</span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={shipping.name}
                    onChange={(e) => setShipping({ ...shipping, name: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm text-slate-400 mb-1">Address</label>
                  <input
                    type="text"
                    value={shipping.address}
                    onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">City</label>
                    <input
                      type="text"
                      value={shipping.city}
                      onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">State</label>
                    <input
                      type="text"
                      value={shipping.state}
                      onChange={(e) => setShipping({ ...shipping, state: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">ZIP Code</label>
                    <input
                      type="text"
                      value={shipping.zip}
                      onChange={(e) => setShipping({ ...shipping, zip: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Country</label>
                    <input
                      type="text"
                      value="United States"
                      disabled
                      className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      We currently only ship within the USA
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Methods */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Payment Method</h2>

              <div className="space-y-3">
                {/* PayPal */}
                <button
                  onClick={() => setPaymentMethod("paypal")}
                  className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                    paymentMethod === "paypal"
                      ? "border-blue-500 bg-blue-500/10"
                      : "border-slate-700 hover:border-slate-600"
                  }`}
                >
                  <div className="w-12 h-8 bg-white rounded flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">PayPal</span>
                  </div>
                  <div className="text-left">
                    <p className="text-white font-medium">PayPal</p>
                    <p className="text-slate-400 text-sm">Pay with PayPal or credit card</p>
                  </div>
                </button>
              </div>

              {/* Pay Button */}
              <button
                onClick={handlePayPal}
                disabled={!paymentMethod || !isShippingComplete || isProcessing}
                className="w-full mt-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all"
              >
                {isProcessing
                  ? "Processing..."
                  : !isShippingComplete
                  ? "Complete Shipping Info"
                  : !paymentMethod
                  ? "Select Payment Method"
                  : `Pay $${orderTotal.toFixed(2)}`}
              </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 sticky top-24">
              <h2 className="text-xl font-bold text-white mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6 max-h-80 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className="w-14 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          width={56}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">
                          🃏
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">{item.name}</p>
                      <p className="text-slate-400 text-sm">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-white font-medium">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-2">
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
                {shippingCost > 0 && total < shippingSettings.freeShippingThreshold && (
                  <p className="text-xs text-slate-500">
                    Add ${(shippingSettings.freeShippingThreshold - total).toFixed(2)} more for free shipping!
                  </p>
                )}
                <div className="flex justify-between text-white font-bold text-lg pt-2 border-t border-slate-800">
                  <span>Total</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

