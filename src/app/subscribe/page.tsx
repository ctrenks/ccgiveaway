"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";

const TIERS = [
  {
    id: "BASIC",
    name: "Basic",
    price: 20,
    color: "from-blue-600 to-cyan-600",
    borderColor: "border-blue-500/30",
    features: [
      { text: "5% off all orders", icon: "💰" },
      { text: "Free shipping on giveaway wins", subtext: "(once per month, bundled)", icon: "📦" },
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
      { text: "5% off all orders", icon: "💰" },
      { text: "Free shipping on ALL orders", subtext: "(once per month)", icon: "📦" },
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
      { text: "7% off all orders", icon: "💰" },
      { text: "Free shipping on ALL orders", subtext: "(once per month)", icon: "📦" },
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

  const handleSubscribe = async (tierId: string) => {
    if (!session) {
      window.location.href = "/auth/signin?callbackUrl=/subscribe";
      return;
    }

    setSelectedTier(tierId);
  };

  return (
    <div className="min-h-screen py-12">
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
          <p className="text-slate-400 max-w-2xl mx-auto">
            Unlock exclusive benefits, earn more credits, and save on every order.
            Cancel anytime - no commitment required.
          </p>
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
                  <p className="text-slate-400 text-sm">
                    Click below to set up your PayPal subscription. You&apos;ll be redirected to PayPal to complete the setup.
                  </p>
                  <button
                    onClick={() => {
                      // TODO: Integrate PayPal subscription
                      alert("PayPal subscription integration coming soon! Please use crypto payment for now.");
                    }}
                    className="w-full py-3 bg-[#0070ba] hover:bg-[#005ea6] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Subscribe with PayPal</span>
                  </button>
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
                You get one free shipping use per month. For Basic tier, this applies to giveaway wins.
                Plus and Premium can use it on any order.
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
