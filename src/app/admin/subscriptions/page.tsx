"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  giveawayCredits: number;
}

interface Subscription {
  id: string;
  userId: string;
  user: User;
  tier: string;
  status: string;
  paymentMethod: string;
  amount: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cryptoNote: string | null;
  createdAt: string;
}

const TIERS = ["BASIC", "PLUS", "PREMIUM"];

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    userId: "",
    tier: "BASIC",
    paymentMethod: "crypto",
    cryptoNote: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSubscriptions();
    fetchUsers();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const res = await fetch("/api/admin/subscriptions");
      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
    } catch {
      setError("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      console.error("Failed to load users");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to create subscription");
      }

      setSuccess("Subscription created/updated successfully!");
      setShowAddForm(false);
      setFormData({ userId: "", tier: "BASIC", paymentMethod: "crypto", cryptoNote: "" });
      fetchSubscriptions();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-500/20 text-green-400",
    PENDING: "bg-amber-500/20 text-amber-400",
    CANCELLED: "bg-red-500/20 text-red-400",
    EXPIRED: "bg-slate-500/20 text-slate-400",
    PAUSED: "bg-blue-500/20 text-blue-400",
  };

  const tierColors: Record<string, string> = {
    BASIC: "text-blue-400",
    PLUS: "text-purple-400",
    PREMIUM: "text-amber-400",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
        >
          {showAddForm ? "Cancel" : "+ Add Subscription"}
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400">
          {success}
        </div>
      )}

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4">Add/Update Subscription</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">User *</label>
                <select
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.email || user.displayName || user.id}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Tier *</label>
                <select
                  value={formData.tier}
                  onChange={(e) => setFormData({ ...formData, tier: e.target.value })}
                  required
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  {TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier} (${tier === "BASIC" ? 20 : tier === "PLUS" ? 35 : 50}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="crypto">Crypto</option>
                  <option value="paypal">PayPal</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-2">Note (for crypto)</label>
                <input
                  type="text"
                  value={formData.cryptoNote}
                  onChange={(e) => setFormData({ ...formData, cryptoNote: e.target.value })}
                  placeholder="e.g., BTC tx hash"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
              <p className="text-amber-400 text-sm">
                ⚠️ This will activate/renew the subscription for 1 month and grant the tier&apos;s monthly credits immediately.
              </p>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white rounded-lg transition-colors"
            >
              {submitting ? "Processing..." : "Activate Subscription"}
            </button>
          </form>
        </div>
      )}

      {/* Subscriptions List */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-slate-400">No subscriptions yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-800/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">User</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Tier</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Status</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Payment</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Period End</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Credits</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-800/30">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${sub.userId}`}
                      className="text-white hover:text-purple-400"
                    >
                      {sub.user.email || sub.user.displayName || sub.userId}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${tierColors[sub.tier]}`}>
                      {sub.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${statusColors[sub.status]}`}>
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {sub.paymentMethod}
                    {sub.cryptoNote && (
                      <span className="block text-xs text-slate-500">{sub.cryptoNote}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {sub.currentPeriodEnd
                      ? new Date(sub.currentPeriodEnd).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-purple-400">
                    {sub.user.giveawayCredits.toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => {
                        setFormData({
                          userId: sub.userId,
                          tier: sub.tier,
                          paymentMethod: sub.paymentMethod,
                          cryptoNote: sub.cryptoNote || "",
                        });
                        setShowAddForm(true);
                      }}
                      className="text-purple-400 hover:text-purple-300 text-sm"
                    >
                      Renew
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

