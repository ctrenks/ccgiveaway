"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import Script from "next/script";

const TIERS = [
  {
    id: "BASIC",
    name: "Basic",
    price: 20,
    color: "from-blue-600 to-cyan-600",
    borderColor: "border-blue-500/30",
    features: [
      { text: "5% off all products", icon: "💰" },
      { text: "Free shipping on products & wins", subtext: "(once per month)", icon: "📦" },
      { text: "100 credits per month", subtext: "(never expire)", icon: "🎟️" },
      { text: "Priority support", icon: "⭐" },
    ],
  },
  {
    id: "PLUS",
    name: "Plus",
    price: 35,
    popular: true,
    color: "from-purple-600 to-pink-600",
    borderColor: "border-purple-500/50",
    features: [
      { text: "5% off all products", icon: "💰" },
      { text: "Free shipping on products & wins", subtext: "(once per month)", icon: "📦" },
      { text: "200 credits per month", subtext: "(never expire)", icon: "🎟️" },
      { text: "Priority support", icon: "⭐" },
      { text: "Early access to new giveaways", icon: "🚀" },
    ],
  },
  {
    id: "PREMIUM",
    name: "Premium",
    price: 50,
    color: "from-amber-500 to-orange-600",
    borderColor: "border-amber-500/30",
    features: [
      { text: "7% off all products", icon: "💰" },
      { text: "Free shipping on products & wins", subtext: "(once per month)", icon: "📦" },
      { text: "340 credits per month", subtext: "(never expire)", icon: "🎟️" },
      { text: "Priority support", icon: "⭐" },
      { text: "Early access to new giveaways", icon: "🚀" },
      { text: "Exclusive member-only deals", icon: "💎" },
    ],
  },
];

export default function SubscribePage() {
  const { data: session } = useSession();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "crypto">("paypal");
  const [planId, setPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const paypalButtonRef = useRef<HTMLDivElement>(null);
  const [paypalLoaded, setPaypalLoaded] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string>("");

  const handleSubscribe = async (tierId: string) => {
    if (!session) {
      window.location.href = "/auth/signin?callbackUrl=/subscribe";
      return;
    }

    setSelectedTier(tierId);
    setError(null);
    setPlanId(null);

    // Fetch and verify the PayPal plan ID for this tier
    try {
      const res = await fetch(`/api/subscriptions/paypal?tier=${tierId}&verify=true`);
      const data = await res.json();

      console.log("Plan verification response:", data);

      if (data.error && !data.planId) {
        setError(data.error);
        return;
      }

      if (data.planId) {
        // Show warning if plan couldn't be verified but still allow attempt
        if (data.verified === false) {
          console.warn("Plan verification failed:", data.error);
          console.warn("Mode:", data.mode);
        } else if (data.planStatus && data.planStatus !== "ACTIVE") {
          setError(`PayPal plan is ${data.planStatus}. It needs to be ACTIVE.`);
          return;
        }
        setPlanId(data.planId);
      } else {
        setError(data.error || "Failed to load payment options");
      }
    } catch (err) {
      console.error("Failed to fetch plan:", err);
      setError("Failed to load payment options");
    }
  };

  // Render PayPal button when plan is selected and PayPal is loaded
  useEffect(() => {
    const renderPayPalButton = () => {
      if (
        selectedTier &&
        planId &&
        paymentMethod === "paypal" &&
        paypalButtonRef.current &&
        (window as any).paypal
      ) {
        // Clear any existing buttons
        paypalButtonRef.current.innerHTML = "";

        try {
          console.log("Rendering PayPal button with plan ID:", planId);

          (window as any).paypal
            .Buttons({
              style: {
                shape: "rect",
                color: "blue",
                layout: "vertical",
                label: "subscribe",
              },
              createSubscription: function (data: any, actions: any) {
                console.log("Creating subscription with plan:", planId);
                return actions.subscription.create({
                  plan_id: planId,
                }).catch((err: any) => {
                  console.error("Subscription creation error:", err);
                  // Extract more details from the error
                  const errorMessage = err?.message || err?.details?.[0]?.description || "Unknown error";
                  setError(`Subscription setup failed: ${errorMessage}`);
                  throw err;
                });
              },
              onApprove: async function (data: any) {
                console.log("Subscription approved:", data);
                setLoading(true);
                try {
                  const res = await fetch("/api/subscriptions/paypal", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      subscriptionId: data.subscriptionID,
                      tier: selectedTier,
                      orderId: data.orderID,
                    }),
                  });

                  const result = await res.json();

                  if (result.success) {
                    setSuccess(true);
                  } else {
                    setError(result.error || "Failed to activate subscription");
                  }
                } catch (err) {
                  setError("Failed to activate subscription");
                } finally {
                  setLoading(false);
                }
              },
              onCancel: function (data: any) {
                console.log("Subscription cancelled by user:", data);
                setError("Subscription was cancelled. Please try again.");
              },
              onError: function (err: any) {
                console.error("PayPal onError:", err);
                // Try to extract meaningful error message
                let errorMsg = "Payment failed. ";
                if (err?.message) {
                  errorMsg += err.message;
                } else if (typeof err === "string") {
                  errorMsg += err;
                } else {
                  errorMsg += "Please check the browser console for details.";
                }
                setError(errorMsg);
              },
            })
            .render(paypalButtonRef.current)
            .catch((err: any) => {
              console.error("PayPal render error:", err);
              setError("Failed to display PayPal button. Please refresh.");
            });
        } catch (err) {
          console.error("Error rendering PayPal button:", err);
          setError("Failed to load PayPal. Please refresh the page.");
        }
      }
    };

    // If PayPal is already loaded, render immediately
    if (paypalLoaded && (window as any).paypal) {
      renderPayPalButton();
    } else if (paypalLoaded) {
      // PayPal SDK loaded but buttons not ready yet - wait a moment
      const timeout = setTimeout(renderPayPalButton, 500);
      return () => clearTimeout(timeout);
    }
  }, [selectedTier, planId, paymentMethod, paypalLoaded]);

  // Success state
  if (success) {
    return (
      <div className="min-h-screen py-12">
        <div className="max-w-lg mx-auto px-4 text-center">
          <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8">
            <div className="text-6xl mb-4">🎉</div>
            <h1 className="text-3xl font-bold text-white mb-4">Welcome to VIP!</h1>
            <p className="text-slate-300 mb-6">
              Your {TIERS.find((t) => t.id === selectedTier)?.name} subscription is now active.
              Credits have been added to your account!
            </p>
            <Link
              href="/giveaways"
              className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-xl"
            >
              Start Entering Giveaways →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      {/* PayPal SDK */}
      <Script
        id="paypal-sdk"
        src={`https://www.paypal.com/sdk/js?client-id=${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb"}&vault=true&intent=subscription`}
        strategy="afterInteractive"
        onLoad={() => {
          const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "sb";
          console.log("PayPal SDK loaded");
          console.log("Client ID starts with:", clientId.substring(0, 10));
          console.log("Client ID ends with:", clientId.substring(clientId.length - 10));
          setDebugInfo(`Client ID: ${clientId.substring(0, 8)}...${clientId.substring(clientId.length - 4)}`);
          setPaypalLoaded(true);
        }}
        onError={(e) => {
          console.error("PayPal SDK failed to load:", e);
          setError("Failed to load PayPal. Please refresh the page.");
        }}
      />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <nav className="flex items-center justify-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-purple-400 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white">Subscribe</span>
          </nav>
          <h1 className="text-4xl font-bold text-white mb-4">
            Collector Card <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">VIP Membership</span>
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto mb-4">
            Unlock exclusive benefits, earn more credits, and save on every order.
            Cancel anytime - no commitment required.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
            <span className="text-green-400">✓</span>
            <span className="text-green-300 text-sm font-medium">Guaranteed 5+ active giveaways every month!</span>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-slate-900/50 border rounded-2xl overflow-hidden transition-all hover:scale-[1.02] ${
                tier.popular ? "border-purple-500/50 shadow-lg shadow-purple-500/10" : tier.borderColor
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white text-center text-sm py-1 font-medium">
                  Most Popular
                </div>
              )}

              <div className={`p-6 ${tier.popular ? "pt-10" : ""}`}>
                <h2 className="text-2xl font-bold text-white mb-2">{tier.name}</h2>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="text-4xl font-bold text-white">${tier.price}</span>
                  <span className="text-slate-500">/month</span>
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-lg">{feature.icon}</span>
                      <div>
                        <span className="text-slate-300">{feature.text}</span>
                        {feature.subtext && (
                          <span className="text-slate-500 text-sm block">{feature.subtext}</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier.id)}
                  className={`w-full py-3 bg-gradient-to-r ${tier.color} hover:opacity-90 text-white font-semibold rounded-xl transition-all`}
                >
                  {session ? "Choose Plan" : "Sign In to Subscribe"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Selected Tier - Payment Options */}
        {selectedTier && (
          <div className="max-w-lg mx-auto">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Subscribe to {TIERS.find(t => t.id === selectedTier)?.name}
              </h3>
              <p className="text-slate-400 mb-6">
                ${TIERS.find(t => t.id === selectedTier)?.price}/month - Choose your payment method:
              </p>

              <div className="space-y-3 mb-6">
                <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl cursor-pointer border border-slate-700 hover:border-purple-500/50 transition-colors">
                  <input
                    type="radio"
                    checked={paymentMethod === "paypal"}
                    onChange={() => setPaymentMethod("paypal")}
                    className="text-purple-500"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">PayPal Subscription</div>
                    <div className="text-slate-500 text-sm">Automatic monthly billing</div>
                  </div>
                  <span className="text-2xl">💳</span>
                </label>

                <label className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl cursor-pointer border border-slate-700 hover:border-purple-500/50 transition-colors">
                  <input
                    type="radio"
                    checked={paymentMethod === "crypto"}
                    onChange={() => setPaymentMethod("crypto")}
                    className="text-purple-500"
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">Crypto Payment</div>
                    <div className="text-slate-500 text-sm">Manual monthly payment via contact form</div>
                  </div>
                  <span className="text-2xl">₿</span>
                </label>
              </div>

              {paymentMethod === "paypal" ? (
                <div className="space-y-4">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                      <p>{error}</p>
                      {debugInfo && (
                        <p className="mt-2 text-xs text-slate-500">Debug: {debugInfo}</p>
                      )}
                    </div>
                  )}

                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto mb-4" />
                      <p className="text-slate-400">Activating your subscription...</p>
                    </div>
                  ) : planId ? (
                    <>
                      <p className="text-slate-400 text-sm mb-4">
                        Complete your subscription setup with PayPal:
                      </p>
                      {/* PayPal Button Container */}
                      <div ref={paypalButtonRef} className="min-h-[50px]" />

                      {/* Show loading state while PayPal SDK loads */}
                      {!paypalLoaded && (
                        <div className="text-center py-4">
                          <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" />
                          <p className="text-slate-500 text-sm mt-2">Loading PayPal...</p>
                        </div>
                      )}

                      {/* Debug info - remove in production */}
                      {paypalLoaded && !((window as any)?.paypal) && (
                        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400 text-sm">
                          PayPal SDK loaded but buttons not available. Please refresh the page.
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto" />
                      <p className="text-slate-500 text-sm mt-2">Loading payment options...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                    <p className="text-amber-400 text-sm">
                      <strong>Crypto Payment Instructions:</strong>
                    </p>
                    <ol className="text-slate-400 text-sm mt-2 space-y-1 list-decimal list-inside">
                      <li>Click the button below to go to our contact form</li>
                      <li>Select &quot;Subscription - Crypto Payment&quot; as the subject</li>
                      <li>Include your chosen tier ({TIERS.find(t => t.id === selectedTier)?.name})</li>
                      <li>We&apos;ll send you payment details and activate your subscription</li>
                    </ol>
                  </div>
                  <Link
                    href={`/contact?subject=Subscription - Crypto Payment&tier=${selectedTier}`}
                    className="block w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-90 text-white font-semibold rounded-xl text-center transition-all"
                  >
                    Contact Us for Crypto Payment
                  </Link>
                </div>
              )}

              <button
                onClick={() => setSelectedTier(null)}
                className="w-full mt-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                ← Choose a different plan
              </button>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Do credits expire?</h3>
              <p className="text-slate-400 text-sm">
                No! Credits earned through your subscription never expire. They accumulate month over month.
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">How does free shipping work?</h3>
              <p className="text-slate-400 text-sm">
                All tiers get one free shipping use per month that works on both store purchases
                and giveaway wins. Use it on whichever you prefer!
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-slate-400 text-sm">
                Yes! Cancel anytime with no fees. You&apos;ll keep your benefits until the end of your billing period.
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">When do I get my credits?</h3>
              <p className="text-slate-400 text-sm">
                Credits are added to your account immediately when you subscribe, then on each monthly renewal.
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">What does shipping on wins cost?</h3>
              <p className="text-slate-400 text-sm">
                Shipping for giveaway wins is a flat $5 for up to 5 packs/items. VIP members can use their
                monthly free shipping on wins too!
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-2">Can I hold my winnings?</h3>
              <p className="text-slate-400 text-sm">
                Yes! You can hold winnings for up to 90 days to bundle shipments. However, if shipping is
                not paid within 90 days, winnings are forfeited.
              </p>
            </div>
          </div>
        </div>

        {/* Current Subscription Status (if logged in) */}
        {session && (
          <div className="mt-12 text-center">
            <Link
              href="/profile"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              View your current subscription status →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
