"use client";

import { useState } from "react";

interface SettingsFormProps {
  initialSettings: {
    discountType: string;
    discountValue: number;
    autoSyncEnabled: boolean;
    syncIntervalDays: number;
    giveawayCreditsPerDollar: number;
    giveawayCreditsEnabled: boolean;
    freeShippingThreshold: number;
    flatShippingRate: number;
  };
}

export function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const handleSave = async () => {
    setIsSaving(true);
    setMessage("");

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setMessage("Settings saved successfully!");
      } else {
        setMessage("Failed to save settings");
      }
    } catch {
      setMessage("Error saving settings");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Price Discount Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          💰 Price Discount (TCGPlayer Import)
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Discount Type
            </label>
            <select
              value={settings.discountType}
              onChange={(e) =>
                setSettings({ ...settings, discountType: e.target.value })
              }
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="percentage">Percentage (%)</option>
              <option value="fixed">Fixed Amount ($)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Discount Value
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.discountValue}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    discountValue: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
              <span className="absolute right-4 top-2.5 text-slate-500">
                {settings.discountType === "percentage" ? "%" : "$"}
              </span>
            </div>
          </div>
        </div>

        <p className="text-slate-500 text-sm mt-3">
          {settings.discountType === "percentage"
            ? `Products will be priced ${settings.discountValue}% below TCGPlayer market price`
            : `Products will be priced $${settings.discountValue} below TCGPlayer market price`}
        </p>
      </div>

      {/* TCGPlayer Sync Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          🔄 TCGPlayer Price Sync
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Auto-Sync Enabled</div>
              <div className="text-slate-500 text-sm">
                Automatically update prices from TCGPlayer
              </div>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  autoSyncEnabled: !settings.autoSyncEnabled,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.autoSyncEnabled ? "bg-purple-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.autoSyncEnabled ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Sync Interval (days)
            </label>
            <input
              type="number"
              min="1"
              value={settings.syncIntervalDays}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  syncIntervalDays: parseInt(e.target.value) || 3,
                })
              }
              className="w-32 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
          </div>
        </div>
      </div>

      {/* Giveaway Credits Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          🎁 Giveaway Credits
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Credits Enabled</div>
              <div className="text-slate-500 text-sm">
                Award credits on purchases for giveaway entries
              </div>
            </div>
            <button
              onClick={() =>
                setSettings({
                  ...settings,
                  giveawayCreditsEnabled: !settings.giveawayCreditsEnabled,
                })
              }
              className={`w-12 h-6 rounded-full transition-colors ${
                settings.giveawayCreditsEnabled ? "bg-purple-600" : "bg-slate-700"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.giveawayCreditsEnabled
                    ? "translate-x-6"
                    : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Credits Per Dollar Spent
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={settings.giveawayCreditsPerDollar}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  giveawayCreditsPerDollar: parseFloat(e.target.value) || 0,
                })
              }
              className="w-32 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            />
            <p className="text-slate-500 text-sm mt-2">
              {settings.giveawayCreditsPerDollar > 0
                ? `Customers earn 1 credit for every $${(
                    1 / settings.giveawayCreditsPerDollar
                  ).toFixed(0)} spent`
                : "Credits disabled"}
            </p>
          </div>
        </div>
      </div>

      {/* Shipping Settings */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">
          📦 Shipping
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Free Shipping Threshold
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.freeShippingThreshold}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    freeShippingThreshold: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full pl-8 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Free shipping on orders over this amount
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Flat Rate (under threshold)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-slate-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.flatShippingRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    flatShippingRate: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full pl-8 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
              />
            </div>
            <p className="text-slate-500 text-xs mt-1">
              Shipping cost when under free threshold
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
          <p className="text-slate-400 text-sm">
            {settings.freeShippingThreshold > 0 ? (
              <>
                <span className="text-green-400">Free shipping</span> on orders over ${settings.freeShippingThreshold}.
                Orders under ${settings.freeShippingThreshold} pay <span className="text-white">${settings.flatShippingRate}</span> flat rate.
              </>
            ) : (
              <span className="text-green-400">Free shipping on all orders</span>
            )}
          </p>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-lg transition-all"
        >
          {isSaving ? "Saving..." : "Save Settings"}
        </button>
        {message && (
          <span
            className={
              message.includes("success") ? "text-green-400" : "text-red-400"
            }
          >
            {message}
          </span>
        )}
      </div>
    </div>
  );
}

