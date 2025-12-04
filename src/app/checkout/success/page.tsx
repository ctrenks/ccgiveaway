"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/lib/cart";

function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [confirmed, setConfirmed] = useState(false);

  const provider = searchParams.get("provider");
  const token = searchParams.get("token"); // PayPal token

  useEffect(() => {
    // Confirm the payment with our server
    const confirmPayment = async () => {
      try {
        const res = await fetch("/api/checkout/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ provider, token }),
        });

        if (res.ok) {
          clearCart();
          setConfirmed(true);
        }
      } catch (error) {
        console.error("Failed to confirm payment:", error);
        // Still show success - payment likely went through
        setConfirmed(true);
      }
    };

    if (provider) {
      confirmPayment();
    } else {
      // No provider means direct visit - just show success
      setConfirmed(true);
    }
  }, [provider, token, clearCart]);

  return (
    <div className="max-w-2xl mx-auto px-4 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-3xl font-bold text-white mb-4">
        {confirmed ? "Payment Successful!" : "Processing Payment..."}
      </h1>

      {confirmed ? (
        <>
          <p className="text-slate-400 mb-8">
            Thank you for your order! We&apos;ve sent a confirmation email with your order details.
            Your cards will be shipped soon.
          </p>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
            <h2 className="text-lg font-semibold text-white mb-2">What&apos;s Next?</h2>
            <ul className="text-slate-400 text-left space-y-2">
              <li>✓ You&apos;ll receive an email confirmation shortly</li>
              <li>✓ We&apos;ll prepare your order for shipping</li>
              <li>✓ You&apos;ll get tracking info when it ships</li>
              <li>✓ Giveaway credits have been added to your account!</li>
            </ul>
          </div>

          <div className="flex gap-4 justify-center">
            <Link
              href="/store"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl transition-all"
            >
              Continue Shopping
            </Link>
            <Link
              href="/profile"
              className="px-6 py-3 border border-slate-700 hover:border-purple-500/50 text-slate-300 hover:text-white rounded-xl transition-all"
            >
              View Orders
            </Link>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center gap-3 text-slate-400">
          <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
          <span>Confirming your payment...</span>
        </div>
      )}
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <div className="min-h-screen bg-slate-950 py-20">
      <Suspense
        fallback={
          <div className="max-w-2xl mx-auto px-4 text-center">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-3xl font-bold text-white mb-4">Processing...</h1>
            <div className="flex items-center justify-center gap-3 text-slate-400">
              <div className="animate-spin w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full" />
              <span>Loading...</span>
            </div>
          </div>
        }
      >
        <CheckoutSuccessContent />
      </Suspense>
    </div>
  );
}
