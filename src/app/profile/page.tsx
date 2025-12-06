"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";

interface GiveawayWin {
  id: string;
  slot: number;
  pickNumber: string;
  distance: number;
  claimed: boolean;
  shippedAt: string | null;
  trackingNumber: string | null;
  usedVipFreeShipping: boolean;
  createdAt: string;
  giveaway: {
    id: string;
    title: string;
    image: string | null;
  };
}

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  totalCreditsEarned: number;
  completedCount: number;
  pendingCount: number;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [wins, setWins] = useState<GiveawayWin[]>([]);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"settings" | "wins" | "referrals">("settings");
  
  // Settings form state
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingShipping, setEditingShipping] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    displayName: "",
    image: "",
    shippingName: "",
    shippingAddress: "",
    shippingCity: "",
    shippingState: "",
    shippingZip: "",
    shippingCountry: "United States",
  });
  const [saveMessage, setSaveMessage] = useState("");

  useEffect(() => {
    if (session?.user) {
      fetchWins();
      fetchReferralData();
      // Initialize form data from session
      setFormData({
        displayName: (session.user as any).displayName || "",
        image: (session.user as any).image || "",
        shippingName: (session.user as any).shippingName || "",
        shippingAddress: (session.user as any).shippingAddress || "",
        shippingCity: (session.user as any).shippingCity || "",
        shippingState: (session.user as any).shippingState || "",
        shippingZip: (session.user as any).shippingZip || "",
        shippingCountry: (session.user as any).shippingCountry || "United States",
      });
    }
  }, [session]);

  const fetchWins = async () => {
    try {
      const res = await fetch("/api/user/wins");
      const data = await res.json();
      setWins(data.wins || []);
    } catch (error) {
      console.error("Failed to fetch wins:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReferralData = async () => {
    try {
      const res = await fetch("/api/user/referral");
      const data = await res.json();
      setReferralData(data);
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
    }
  };

  const copyReferralLink = () => {
    if (referralData?.referralUrl) {
      navigator.clipboard.writeText(referralData.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: uploadFormData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setFormData({ ...formData, image: url });
        await saveProfile({ image: url });
        setSaveMessage("Avatar updated!");
        setTimeout(() => setSaveMessage(""), 3000);
      } else {
        setSaveMessage("Failed to upload avatar");
      }
    } catch (error) {
      console.error("Upload error:", error);
      setSaveMessage("Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async (updates: Partial<typeof formData>) => {
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const { user } = await res.json();
        await update(); // Refresh session
        setSaveMessage("Profile updated!");
        setTimeout(() => setSaveMessage(""), 3000);
        setEditingProfile(false);
        setEditingShipping(false);
        return true;
      } else {
        const error = await res.json();
        setSaveMessage(error.error || "Failed to save");
        return false;
      }
    } catch (error) {
      console.error("Save error:", error);
      setSaveMessage("Failed to save");
      return false;
    }
  };

  const handleSaveProfile = () => {
    saveProfile({ displayName: formData.displayName });
  };

  const handleSaveShipping = () => {
    saveProfile({
      shippingName: formData.shippingName,
      shippingAddress: formData.shippingAddress,
      shippingCity: formData.shippingCity,
      shippingState: formData.shippingState,
      shippingZip: formData.shippingZip,
      shippingCountry: formData.shippingCountry,
    });
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in</h1>
          <Link href="/api/auth/signin" className="text-purple-400 hover:underline">
            Sign in to view your profile
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
          <p className="text-slate-400">
            {session.user.name || session.user.email}
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "settings"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
          >
            ⚙️ Settings
          </button>
          <button
            onClick={() => setActiveTab("wins")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "wins"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
          >
            🏆 Wins
          </button>
          <button
            onClick={() => setActiveTab("referrals")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === "referrals"
                ? "bg-purple-600 text-white"
                : "bg-slate-800 hover:bg-slate-700 text-white"
            }`}
          >
            🔗 Referrals
          </button>
        </div>

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">⚙️ Account Settings</h2>

            {saveMessage && (
              <div className="mb-4 p-4 bg-green-500/20 border border-green-500/30 rounded-lg text-green-400">
                {saveMessage}
              </div>
            )}

            <div className="space-y-6">
              {/* Avatar */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Profile Picture</h3>
                <div className="flex items-center gap-6">
                  {formData.image ? (
                    <Image
                      src={formData.image}
                      alt="Avatar"
                      width={100}
                      height={100}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-slate-700 flex items-center justify-center text-4xl">
                      👤
                    </div>
                  )}
                  <div>
                    <label className="cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors inline-block">
                      {uploadingAvatar ? "Uploading..." : "Upload New Avatar"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="hidden"
                      />
                    </label>
                    <p className="text-slate-400 text-xs mt-2">JPG, PNG, GIF or WebP (max 5MB)</p>
                  </div>
                </div>
              </div>

              {/* Profile Info */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Profile Information</h3>
                  {!editingProfile && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>
                
                {editingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Display Name</label>
                      <input
                        type="text"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="Enter display name"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveProfile}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingProfile(false);
                          setFormData({ ...formData, displayName: (session.user as any).displayName || "" });
                        }}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="text-slate-400 text-sm">Display Name</label>
                      <p className="text-white font-medium">
                        {(session.user as any).displayName || (session.user as any).name || "Not set"}
                      </p>
                    </div>
                    <div>
                      <label className="text-slate-400 text-sm">Email</label>
                      <p className="text-white font-medium">{(session.user as any).email}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* VIP Status */}
              {(session.user as any).subscriptionTier ? (
                <div className="bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-amber-400 mb-2">
                    🌟 VIP {(session.user as any).subscriptionTier} Member
                  </h3>
                  <p className="text-slate-300 text-sm mb-4">
                    You're enjoying exclusive VIP benefits including discounts, free shipping, and monthly credits!
                  </p>
                  <Link
                    href="/subscribe"
                    className="inline-block px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-sm transition-colors"
                  >
                    Manage Subscription
                  </Link>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-2">Upgrade to VIP</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Get exclusive discounts, free shipping, and monthly credits with a VIP membership!
                  </p>
                  <Link
                    href="/subscribe"
                    className="inline-block px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg font-medium transition-all"
                  >
                    Become VIP →
                  </Link>
                </div>
              )}

              {/* Shipping Address */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">Shipping Address</h3>
                  {!editingShipping && (session.user as any).shippingAddress && (
                    <button
                      onClick={() => setEditingShipping(true)}
                      className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-sm rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingShipping || !(session.user as any).shippingAddress ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Full Name</label>
                      <input
                        type="text"
                        value={formData.shippingName}
                        onChange={(e) => setFormData({ ...formData, shippingName: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-sm mb-2">Street Address</label>
                      <input
                        type="text"
                        value={formData.shippingAddress}
                        onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                        placeholder="123 Main St"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 text-sm mb-2">City</label>
                        <input
                          type="text"
                          value={formData.shippingCity}
                          onChange={(e) => setFormData({ ...formData, shippingCity: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-sm mb-2">State</label>
                        <input
                          type="text"
                          value={formData.shippingState}
                          onChange={(e) => setFormData({ ...formData, shippingState: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                          placeholder="NY"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-slate-400 text-sm mb-2">ZIP Code</label>
                        <input
                          type="text"
                          value={formData.shippingZip}
                          onChange={(e) => setFormData({ ...formData, shippingZip: e.target.value })}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                          placeholder="10001"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 text-sm mb-2">Country</label>
                        <input
                          type="text"
                          value="United States"
                          disabled
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 text-slate-500"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSaveShipping}
                        className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg transition-colors"
                      >
                        Save Address
                      </button>
                      {(session.user as any).shippingAddress && (
                        <button
                          onClick={() => {
                            setEditingShipping(false);
                            setFormData({
                              ...formData,
                              shippingName: (session.user as any).shippingName || "",
                              shippingAddress: (session.user as any).shippingAddress || "",
                              shippingCity: (session.user as any).shippingCity || "",
                              shippingState: (session.user as any).shippingState || "",
                              shippingZip: (session.user as any).shippingZip || "",
                            });
                          }}
                          className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-slate-300 text-sm space-y-1">
                    <p>{(session.user as any).shippingName}</p>
                    <p>{(session.user as any).shippingAddress}</p>
                    <p>
                      {(session.user as any).shippingCity}, {(session.user as any).shippingState}{" "}
                      {(session.user as any).shippingZip}
                    </p>
                    <p>{(session.user as any).shippingCountry || "USA"}</p>
                  </div>
                )}
              </div>

              {/* Account Actions */}
              <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">Account Actions</h3>
                <button
                  onClick={() => window.location.href = "/api/auth/signout"}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Giveaway Wins Tab */}
        {activeTab === "wins" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🏆 My Giveaway Wins</h2>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
            </div>
          ) : wins.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-slate-400 mb-4">You haven't won any giveaways yet</p>
              <Link
                href="/giveaways"
                className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
              >
                Enter a Giveaway
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {wins.map((win) => (
                <div
                  key={win.id}
                  className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-purple-500/30 transition-colors"
                >
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

                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {win.giveaway.title}
                          </h3>
                          <p className="text-slate-400 text-sm">
                            Slot {win.slot} • Pick #{win.pickNumber} • Distance: {win.distance}
                          </p>
                          <p className="text-slate-500 text-xs mt-1">
                            Won on {new Date(win.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        {/* Shipping Status */}
                        {win.shippedAt ? (
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-green-500/20 border border-green-500/30 text-green-400 rounded-full text-xs font-semibold mb-2">
                              ✓ Shipped
                            </span>
                            {win.trackingNumber && (
                              <p className="text-slate-400 text-xs">
                                Tracking: {win.trackingNumber}
                              </p>
                            )}
                            {win.usedVipFreeShipping && (
                              <p className="text-amber-400 text-xs mt-1">
                                VIP Free Shipping
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-orange-500/20 border border-orange-500/30 text-orange-400 rounded-full text-xs font-semibold mb-2">
                              ⏳ Awaiting Shipping
                            </span>
                            {(session.user as any).subscriptionTier ? (
                              <p className="text-amber-400 text-xs">
                                VIP Free Shipping Available
                                <br />
                                <span className="text-slate-500">(20th-28th of month)</span>
                              </p>
                            ) : (
                              <Link
                                href={`/profile/wins/${win.id}/shipping`}
                                className="block mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded-lg transition-colors"
                              >
                                Purchase Shipping
                              </Link>
                            )}
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/giveaways/${win.giveaway.id}`}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        View Giveaway →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}

        {/* Referrals Tab */}
        {activeTab === "referrals" && (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-white mb-6">🔗 Referral Program</h2>

            {!referralData ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-purple-400">{referralData.completedCount}</div>
                    <div className="text-slate-400 text-sm mt-1">Successful Referrals</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-amber-400">{referralData.totalCreditsEarned}</div>
                    <div className="text-slate-400 text-sm mt-1">Credits Earned</div>
                  </div>
                  <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 text-center">
                    <div className="text-3xl font-bold text-blue-400">{referralData.pendingCount}</div>
                    <div className="text-slate-400 text-sm mt-1">Pending</div>
                  </div>
                </div>

                {/* Referral Link */}
                <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-3">Your Referral Link</h3>
                  <p className="text-slate-300 text-sm mb-4">
                    Share this link with friends. When they sign up, you both win! You get <strong className="text-purple-400">100 credits</strong> instantly.
                  </p>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={referralData.referralUrl}
                      readOnly
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm"
                    />
                    <button
                      onClick={copyReferralLink}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors font-medium"
                    >
                      {copied ? "✓ Copied!" : "Copy"}
                    </button>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                        `Join me on Collector Card Giveaway and get 10 free entries to win rare cards! ${referralData.referralUrl}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-400 text-white rounded-lg text-center text-sm transition-colors"
                    >
                      Share on Twitter
                    </a>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralData.referralUrl)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-center text-sm transition-colors"
                    >
                      Share on Facebook
                    </a>
                  </div>
                </div>

                {/* How it Works */}
                <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
                  <h3 className="text-lg font-bold text-white mb-3">How It Works</h3>
                  <ol className="space-y-2 text-slate-300 text-sm">
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-bold">1.</span>
                      <span>Share your unique referral link with friends</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-bold">2.</span>
                      <span>They click your link and sign up</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-bold">3.</span>
                      <span>You instantly receive <strong className="text-amber-400">100 credits</strong>!</span>
                    </li>
                    <li className="flex gap-3">
                      <span className="text-purple-400 font-bold">4.</span>
                      <span>No limit - refer as many friends as you want!</span>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {/* VIP Info */}
        {(session.user as any).subscriptionTier && (
          <div className="mt-6 bg-gradient-to-br from-amber-900/30 to-orange-900/30 border border-amber-500/30 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-amber-400 mb-3">
              🌟 VIP {(session.user as any).subscriptionTier} Member
            </h3>
            <p className="text-slate-300 text-sm">
              You receive free shipping on giveaway wins once per month between the 20th-28th.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
