"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ROLE_NAMES } from "@/lib/constants";

interface User {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  role: number;
  giveawayCredits: number;
  createdAt: string;
  _count: {
    orders: number;
  };
}

interface CreditLog {
  id: string;
  amount: number;
  reason: string | null;
  adminEmail: string | null;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: string;
}

export default function EditUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [creditLogs, setCreditLogs] = useState<CreditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form state
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(0);

  // Credit adjustment
  const [creditAmount, setCreditAmount] = useState("");
  const [creditReason, setCreditReason] = useState("");
  const [adjustingCredits, setAdjustingCredits] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
          setEmail(data.user.email || "");
          setRole(data.user.role);
        }
        if (data.creditLogs) {
          setCreditLogs(data.creditLogs);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to update user");
      }

      setUser(data.user);
      setSuccess("User updated successfully");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleCreditAdjustment = async (isAdd: boolean) => {
    const amount = parseInt(creditAmount);
    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    setAdjustingCredits(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/users/${id}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: isAdd ? amount : -amount,
          reason: creditReason || (isAdd ? "Manual credit addition" : "Manual credit removal"),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to adjust credits");
      }

      setUser(data.user);
      setCreditLogs([data.log, ...creditLogs]);
      setCreditAmount("");
      setCreditReason("");
      setSuccess(`${isAdd ? "Added" : "Removed"} ${amount} credits`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to adjust credits");
    } finally {
      setAdjustingCredits(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">User not found</h1>
        <Link href="/admin/users" className="text-purple-400 hover:underline">
          Back to users
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/users"
          className="text-slate-400 hover:text-white transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-white">Edit User</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Info & Edit */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">User Information</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-400 text-sm">
                {success}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">User ID</label>
                <div className="text-white font-mono text-sm bg-slate-800 px-3 py-2 rounded">
                  {user.id}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Display Name</label>
                <div className="text-white bg-slate-800 px-3 py-2 rounded">
                  {user.displayName || user.name || "Not set"}
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(parseInt(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value={0}>User (0)</option>
                  <option value={1}>Banned (1) - Cannot participate in giveaways</option>
                  <option value={5}>Moderator (5)</option>
                  <option value={9}>Admin (9)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">Orders:</span>
                  <span className="text-white ml-2">{user._count.orders}</span>
                </div>
                <div>
                  <span className="text-slate-400">Joined:</span>
                  <span className="text-white ml-2">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>

          {/* Credit Adjustment */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">
              Giveaway Credits
            </h2>

            <div className="text-center mb-6">
              <div className="text-4xl font-bold text-amber-400">
                🎁 {user.giveawayCredits}
              </div>
              <div className="text-slate-400 text-sm">Current Balance</div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Amount</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  placeholder="Enter amount"
                  min="1"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm text-slate-400 mb-1">Reason (logged)</label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="e.g., Compensation for issue"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleCreditAdjustment(true)}
                  disabled={adjustingCredits || !creditAmount}
                  className="py-2 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  + Add Credits
                </button>
                <button
                  onClick={() => handleCreditAdjustment(false)}
                  disabled={adjustingCredits || !creditAmount}
                  className="py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
                >
                  - Remove Credits
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Credit History */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4">Credit History</h2>

          {creditLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No manual credit adjustments
            </div>
          ) : (
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {creditLogs.map((log) => (
                <div
                  key={log.id}
                  className={`p-3 rounded-lg ${
                    log.amount > 0
                      ? "bg-green-500/10 border border-green-500/30"
                      : "bg-red-500/10 border border-red-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`font-bold ${
                        log.amount > 0 ? "text-green-400" : "text-red-400"
                      }`}
                    >
                      {log.amount > 0 ? "+" : ""}{log.amount} credits
                    </span>
                    <span className="text-slate-500 text-xs">
                      {new Date(log.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="text-slate-400 text-sm">
                    {log.reason || "No reason provided"}
                  </div>
                  <div className="text-slate-500 text-xs mt-1">
                    Balance: {log.balanceBefore} → {log.balanceAfter}
                    {log.adminEmail && ` • By ${log.adminEmail}`}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
