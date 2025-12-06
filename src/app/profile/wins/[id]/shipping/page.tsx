"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface GiveawayWin {
  id: string;
  slot: number;
  pickNumber: string;
  claimed: boolean;
  giveaway: {
    title: string;
    image: string | null;
  };
}

export default function PurchaseShippingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [win, setWin] = useState<GiveawayWin | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  const SHIPPING_COST = 5.00; // $5 shipping fee

  useEffect(() => {
    fetchWin();
  }, [id]);

  const fetchWin = async () => {
    try {
      const res = await fetch(`/api/user/wins/${id}`);
      const data = await res.json();
      
      if (data.win) {
        setWin(data.win);
      }
    } catch (error) {
      console.error("Failed to fetch win:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePurchaseShipping = async () => {
    setProcessing(true);

    try {
      const res = await fetch(`/api/user/wins/${id}/purchase-shipping`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.approvalUrl) {
        // Redirect to PayPal
        window.location.href = data.approvalUrl;
      } else {
        alert("Failed to create payment");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Failed to purchase shipping:", error);
      alert("Failed to purchase shipping");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!win) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Win not found</h1>
          <Link href="/profile" className="text-purple-400 hover:underline">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  if (win.claimed) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Already Shipped</h1>
          <p className="text-slate-400 mb-4">This prize has already been shipped.</p>
          <Link href="/profile" className="text-purple-400 hover:underline">
            Back to Profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/profile"
          className="inline-block text-slate-400 hover:text-white mb-6 transition-colors"
        >
          ← Back to Profile
        </Link>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-6">Purchase Shipping</h1>

          {/* Win Details */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
            <div className="flex gap-6">
              {win.giveaway.image && (
                <div className="w-24 h-24 relative flex-shrink-0">
                  <Image
                    src={win.giveaway.image}
                    alt={win.giveaway.title}
                    fill
                    className="object-cover rounded-lg"
                  />
                </div>
              )}
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  {win.giveaway.title}
                </h2>
                <p className="text-slate-400 text-sm">
                  Slot {win.slot} • Pick #{win.pickNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Shipping Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
            <p className="text-blue-300 text-sm">
              ℹ️ We ship via USPS First Class Mail within the USA. You'll receive tracking information once shipped.
            </p>
          </div>

          {/* Cost Breakdown */}
          <div className="bg-slate-800/50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center text-lg">
              <span className="text-slate-300">Shipping Fee:</span>
              <span className="text-white font-bold">${SHIPPING_COST.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Button */}
          <button
            onClick={handlePurchaseShipping}
            disabled={processing}
            className="w-full py-4 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-bold rounded-lg transition-colors text-lg"
          >
            {processing ? "Processing..." : `Pay $${SHIPPING_COST.toFixed(2)} via PayPal`}
          </button>

          {/* VIP Upgrade Notice */}
          <div className="mt-6 bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-6">
            <h3 className="text-lg font-bold text-amber-400 mb-2">
              💡 Want Free Shipping?
            </h3>
            <p className="text-slate-300 text-sm mb-4">
              VIP members get free shipping on giveaway wins once per month (20th-28th).
            </p>
            <Link
              href="/subscribe"
              className="inline-block px-6 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Upgrade to VIP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

