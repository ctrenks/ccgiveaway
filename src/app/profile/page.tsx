"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface UserProfile {
  id: string;
  name: string | null;
  displayName: string | null;
  email: string | null;
  image: string | null;
  giveawayCredits: number;
  shippingName: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingState: string | null;
  shippingZip: string | null;
  shippingCountry: string | null;
  createdAt: string;
}

interface ReferralData {
  referralCode: string;
  referralUrl: string;
  totalCreditsEarned: number;
  completedCount: number;
  pendingCount: number;
  referrals: Array<{
    id: string;
    referredEmail: string;
    status: string;
    creditsAwarded: number;
    createdAt: string;
    completedAt: string | null;
  }>;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [referralData, setReferralData] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [name, setName] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingState, setShippingState] = useState("");
  const [shippingZip, setShippingZip] = useState("");
  const [shippingCountry, setShippingCountry] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchProfile();
      fetchReferralData();
    }
  }, [session?.user?.id]);

  const fetchReferralData = async () => {
    try {
      const res = await fetch("/api/user/referral");
      const data = await res.json();
      if (data.referralCode) {
        setReferralData(data);
      }
    } catch (error) {
      console.error("Error fetching referral data:", error);
    }
  };

  const copyReferralLink = () => {
    if (referralData?.referralUrl) {
      navigator.clipboard.writeText(referralData.referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/user/profile");
      const data = await res.json();
      if (data.user) {
        setProfile(data.user);
        setDisplayName(data.user.displayName || "");
        setName(data.user.name || "");
        setShippingName(data.user.shippingName || "");
        setShippingAddress(data.user.shippingAddress || "");
        setShippingCity(data.user.shippingCity || "");
        setShippingState(data.user.shippingState || "");
        setShippingZip(data.user.shippingZip || "");
        setShippingCountry(data.user.shippingCountry || "");
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    setMessage({ type: "", text: "" });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Upload failed");
      }

      const { url } = await uploadRes.json();

      // Update profile with new image
      const updateRes = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: url }),
      });

      if (updateRes.ok) {
        const data = await updateRes.json();
        setProfile(data.user);
        setMessage({ type: "success", text: "Avatar updated!" });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setMessage({ type: "error", text: "Failed to upload image" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName || null,
          name,
          shippingName,
          shippingAddress,
          shippingCity,
          shippingState,
          shippingZip,
          shippingCountry,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to save" });
        return;
      }

      setProfile(data.user);
      setMessage({ type: "success", text: "Profile saved!" });
    } catch (error) {
      console.error("Save error:", error);
      setMessage({ type: "error", text: "Failed to save profile" });
    } finally {
      setIsSaving(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8">Your Profile</h1>

        {/* Avatar Section */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Avatar</h2>
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                {profile?.image ? (
                  <Image
                    src={profile.image}
                    alt="Avatar"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-3xl font-bold">
                    {(profile?.name || profile?.email || "U")[0].toUpperCase()}
                  </span>
                )}
              </div>
              {uploadingImage && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
                </div>
              )}
            </div>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingImage}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 text-white rounded-lg transition-colors"
              >
                {uploadingImage ? "Uploading..." : "Change Avatar"}
              </button>
              <p className="text-slate-500 text-sm mt-2">JPG, PNG, GIF up to 5MB</p>
            </div>
          </div>
        </div>

        {/* Credits Display */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Giveaway Credits</h2>
              <p className="text-slate-400 text-sm">Earn credits by making purchases</p>
            </div>
            <div className="text-4xl font-bold text-amber-400">
              🎁 {profile?.giveawayCredits || 0}
            </div>
          </div>
        </div>

        {/* Referral Section */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">🔗</span>
            <div>
              <h2 className="text-lg font-semibold text-white">Refer Friends, Earn Credits!</h2>
              <p className="text-slate-400 text-sm">Get 100 credits for each friend who signs up</p>
            </div>
          </div>

          {referralData ? (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Your Referral Link
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={referralData.referralUrl}
                    readOnly
                    className="flex-1 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  />
                  <button
                    onClick={copyReferralLink}
                    className={`px-4 py-2 rounded-lg font-medium transition-all ${
                      copied
                        ? "bg-green-600 text-white"
                        : "bg-purple-600 hover:bg-purple-500 text-white"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-green-400">{referralData.completedCount}</div>
                  <div className="text-xs text-slate-400">Successful</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-amber-400">{referralData.pendingCount}</div>
                  <div className="text-xs text-slate-400">Pending</div>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3">
                  <div className="text-2xl font-bold text-purple-400">{referralData.totalCreditsEarned}</div>
                  <div className="text-xs text-slate-400">Credits Earned</div>
                </div>
              </div>

              {referralData.referrals.length > 0 && (
                <details className="mt-4">
                  <summary className="text-sm text-purple-400 cursor-pointer hover:text-purple-300">
                    View referral history ({referralData.referrals.length})
                  </summary>
                  <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                    {referralData.referrals.map((ref) => (
                      <div
                        key={ref.id}
                        className="flex items-center justify-between p-2 bg-slate-800/50 rounded-lg text-sm"
                      >
                        <span className="text-slate-300">{ref.referredEmail}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          ref.status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {ref.status === "COMPLETED" ? `+${ref.creditsAwarded}` : "Pending"}
                        </span>
                      </div>
                    ))}
                  </div>
                </details>
              )}
            </>
          ) : (
            <div className="text-center py-4 text-slate-400">
              Loading referral info...
            </div>
          )}
        </div>

        {/* Profile Info */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Profile Info</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Display Name (unique)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Choose a unique display name"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className="w-full px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400"
              />
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Shipping Address</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Full Name (for shipping)
              </label>
              <input
                type="text"
                value={shippingName}
                onChange={(e) => setShippingName(e.target.value)}
                placeholder="Name on package"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="123 Main St, Apt 4"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={shippingCity}
                  onChange={(e) => setShippingCity(e.target.value)}
                  placeholder="City"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  State/Province
                </label>
                <input
                  type="text"
                  value={shippingState}
                  onChange={(e) => setShippingState(e.target.value)}
                  placeholder="State"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  ZIP/Postal Code
                </label>
                <input
                  type="text"
                  value={shippingZip}
                  onChange={(e) => setShippingZip(e.target.value)}
                  placeholder="12345"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={shippingCountry}
                  onChange={(e) => setShippingCountry(e.target.value)}
                  placeholder="United States"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === "success"
                ? "bg-green-500/20 border border-green-500/30 text-green-400"
                : "bg-red-500/20 border border-red-500/30 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl transition-all"
        >
          {isSaving ? "Saving..." : "Save Profile"}
        </button>

        {/* Member Since */}
        <p className="text-center text-slate-500 text-sm mt-6">
          Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "..."}
        </p>
      </div>
    </div>
  );
}

