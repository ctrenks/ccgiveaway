"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PreviewData {
  product: {
    name: string;
    setName?: string;
    cardNumber?: string;
    rarity?: string;
    imageUrl?: string;
    game: string;
  };
  priceInfo: {
    tcgPlayerPrice: number;
    ourPrice: number;
    discount: { discountType: string; discountValue: number };
    savings: number;
  };
}

export default function ImportProduct() {
  const [importMode, setImportMode] = useState<"single" | "bulk">("single");
  
  // Single import state
  const [url, setUrl] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [condition, setCondition] = useState<"NEW" | "OPENED" | "USED">("NEW");
  const [marketPrice, setMarketPrice] = useState<string>("");
  const [discountType, setDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [isFetching, setIsFetching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Bulk import state
  const [bulkText, setBulkText] = useState("");
  const [bulkCondition, setBulkCondition] = useState<"NEW" | "OPENED" | "USED">("NEW");
  const [bulkDiscountType, setBulkDiscountType] = useState<"percentage" | "fixed">("percentage");
  const [bulkDiscountValue, setBulkDiscountValue] = useState<number>(10);
  const [bulkDefaultPrice, setBulkDefaultPrice] = useState<string>("1.00");
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkError, setBulkError] = useState("");
  const [bulkSuccess, setBulkSuccess] = useState("");
  const [bulkResults, setBulkResults] = useState<Array<{name: string; status: string; error?: string}>>([]);

  // Load default settings
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.settings) {
          setDiscountType(data.settings.discountType || "percentage");
          setDiscountValue(Number(data.settings.discountValue) || 10);
          setBulkDiscountType(data.settings.discountType || "percentage");
          setBulkDiscountValue(Number(data.settings.discountValue) || 10);
        }
      })
      .catch(() => {});
  }, []);

  // Parse TCGPlayer scanner format: "1 Card Name (Variant) [SET] 123"
  const parseBulkLine = (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return null;
    
    // Match pattern: quantity name [set] number
    const match = trimmed.match(/^(\d+)\s+(.+?)\s+\[([^\]]+)\]\s+(\d+)$/);
    if (!match) return null;
    
    const [, quantity, namePart, set, collectorNumber] = match;
    // Remove variant info in parentheses for cleaner name
    const name = namePart.replace(/\s*\([^)]+\)\s*/g, ' ').trim();
    
    return {
      quantity: parseInt(quantity),
      name,
      set,
      collectorNumber,
      fullName: namePart // Keep full name with variants for display
    };
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) {
      setBulkError("Please paste TCGPlayer scanner export");
      return;
    }

    const defaultPrice = parseFloat(bulkDefaultPrice);
    if (!defaultPrice || defaultPrice <= 0) {
      setBulkError("Please enter a valid default market price");
      return;
    }

    setIsBulkImporting(true);
    setBulkError("");
    setBulkSuccess("");
    setBulkResults([]);

    const lines = bulkText.split('\n');
    const parsed = lines.map(parseBulkLine).filter(Boolean);
    
    if (parsed.length === 0) {
      setBulkError("No valid cards found. Format: '1 Card Name [SET] 123'");
      setIsBulkImporting(false);
      return;
    }

    const results: Array<{name: string; status: string; error?: string}> = [];
    let successCount = 0;

    for (const card of parsed) {
      if (!card) continue;
      
      try {
        // Create search URL for TCGPlayer
        const searchName = encodeURIComponent(`${card.name} ${card.set}`);
        const tcgUrl = `https://www.tcgplayer.com/search/all/product?q=${searchName}`;
        
        const res = await fetch("/api/products/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: tcgUrl,
            quantity: card.quantity,
            condition: bulkCondition,
            manualPrice: defaultPrice,
            discountType: bulkDiscountType,
            discountValue: bulkDiscountValue,
            // Pass card info for manual creation if URL scraping fails
            manualCardInfo: {
              name: card.fullName,
              setName: card.set,
              cardNumber: card.collectorNumber
            }
          }),
        });

        if (res.ok) {
          results.push({ name: card.fullName, status: 'success' });
          successCount++;
        } else {
          const data = await res.json();
          results.push({ name: card.fullName, status: 'failed', error: data.error || 'Unknown error' });
        }
      } catch (err) {
        results.push({ name: card?.fullName || 'Unknown', status: 'failed', error: 'Network error' });
      }
    }

    setBulkResults(results);
    if (successCount > 0) {
      setBulkSuccess(`Successfully imported ${successCount} of ${parsed.length} cards!`);
      if (successCount === parsed.length) {
        setBulkText("");
      }
    } else {
      setBulkError("Failed to import any cards. Check the results below.");
    }
    setIsBulkImporting(false);
  };

  const handlePreview = async () => {
    if (!url) return;
    setIsFetching(true);
    setError("");
    setPreview(null);
    setMarketPrice("");

    try {
      const res = await fetch(`/api/products/import?url=${encodeURIComponent(url)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to fetch product");
        return;
      }

      setPreview(data);
      // Pre-fill market price if found
      if (data.priceInfo.tcgPlayerPrice > 0) {
        setMarketPrice(data.priceInfo.tcgPlayerPrice.toString());
      }
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsFetching(false);
    }
  };

  const handleImport = async () => {
    if (!url) return;

    const price = parseFloat(marketPrice);
    if (!price || price <= 0) {
      setError("Please enter a valid market price");
      return;
    }

    setIsImporting(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          quantity,
          condition,
          manualPrice: price,
          discountType,
          discountValue,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to import product");
        return;
      }

      setSuccess(`Successfully imported "${data.product.name}" at $${Number(data.product.price).toFixed(2)}!`);
      setUrl("");
      setPreview(null);
      setMarketPrice("");
    } catch {
      setError("Failed to connect to server");
    } finally {
      setIsImporting(false);
    }
  };

  // Calculate discounted price preview
  const parsedPrice = parseFloat(marketPrice) || 0;
  const discountedPrice = discountType === "percentage"
    ? parsedPrice * (1 - discountValue / 100)
    : Math.max(0, parsedPrice - discountValue);

  return (
    <div>
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/products" className="text-slate-400 hover:text-white">
          ← Back
        </Link>
        <h1 className="text-3xl font-bold text-white">Import from TCGPlayer</h1>
      </div>

      {/* Mode Tabs */}
      <div className="flex gap-2 mb-6 max-w-2xl">
        <button
          onClick={() => setImportMode("single")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            importMode === "single"
              ? "bg-purple-600 text-white"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          Single Import (URL)
        </button>
        <button
          onClick={() => setImportMode("bulk")}
          className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
            importMode === "bulk"
              ? "bg-purple-600 text-white"
              : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          Bulk Import (Scanner)
        </button>
      </div>

      {importMode === "single" ? (
        <div className="max-w-2xl">
          {/* URL Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
          <label className="block text-sm font-medium text-slate-300 mb-2">
            TCGPlayer Product URL
          </label>
          <div className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.tcgplayer.com/product/..."
              className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
            <button
              onClick={handlePreview}
              disabled={isFetching || !url}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg transition-colors"
            >
              {isFetching ? "Loading..." : "Fetch"}
            </button>
          </div>
          <p className="text-slate-500 text-sm mt-2">
            Paste a TCGPlayer URL to fetch card name, set, and image
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Success */}
        {success && (
          <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6 text-green-400">
            {success}
            <Link href="/admin/products" className="ml-2 underline">
              View Products
            </Link>
          </div>
        )}

        {/* Preview */}
        {preview && (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">Product Info</h2>

            <div className="flex gap-6">
              {/* Image */}
              {preview.product.imageUrl && (
                <div className="w-32 h-44 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={preview.product.imageUrl}
                    alt={preview.product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Details */}
              <div className="flex-1 space-y-3">
                <div>
                  <div className="text-slate-500 text-sm">Name</div>
                  <div className="text-white font-medium">{preview.product.name}</div>
                </div>
                {preview.product.setName && (
                  <div>
                    <div className="text-slate-500 text-sm">Set</div>
                    <div className="text-white">{preview.product.setName}</div>
                  </div>
                )}
                {preview.product.rarity && (
                  <div>
                    <div className="text-slate-500 text-sm">Rarity</div>
                    <div className="text-white">{preview.product.rarity}</div>
                  </div>
                )}
                <div>
                  <div className="text-slate-500 text-sm">Game</div>
                  <div className="text-white capitalize">{preview.product.game}</div>
                </div>
              </div>
            </div>

            {/* Price & Discount */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    TCGPlayer Market Price *
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3 text-slate-400">$</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={marketPrice}
                      onChange={(e) => setMarketPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Your Price
                  </label>
                  <div className="px-4 py-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <span className="text-green-400 text-lg font-bold">
                      ${discountedPrice.toFixed(2)}
                    </span>
                    {parsedPrice > 0 && (
                      <span className="text-slate-500 text-sm ml-2">
                        (save ${(parsedPrice - discountedPrice).toFixed(2)})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Adjustable Discount */}
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-slate-300 text-sm font-medium">Discount for this import:</span>
                  <Link href="/admin/settings" className="text-purple-400 text-xs hover:underline">
                    Change default →
                  </Link>
                </div>
                <div className="flex gap-3">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as "percentage" | "fixed")}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                    />
                    <span className="absolute right-3 top-2 text-slate-500 text-sm">
                      {discountType === "percentage" ? "%" : "$"}
                    </span>
                  </div>
                </div>
                <p className="text-slate-500 text-xs mt-2">
                  {discountType === "percentage"
                    ? `${discountValue}% off TCGPlayer price`
                    : `$${discountValue} off TCGPlayer price`}
                </p>
              </div>
            </div>

            {/* Import Options */}
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value as "NEW" | "OPENED" | "USED")}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="NEW">New (Sealed)</option>
                  <option value="OPENED">Opened</option>
                  <option value="USED">Used</option>
                </select>
              </div>
            </div>

            {/* Import Button */}
            <button
              onClick={handleImport}
              disabled={isImporting || !marketPrice || parseFloat(marketPrice) <= 0}
              className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all"
            >
              {isImporting ? "Importing..." : `Import at $${discountedPrice.toFixed(2)}`}
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h3 className="text-white font-medium mb-3">How to Import</h3>
          <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm">
            <li>Copy the product URL from TCGPlayer</li>
            <li>Paste it above and click &quot;Fetch&quot;</li>
            <li>Enter the Market Price shown on TCGPlayer</li>
            <li>Adjust discount if needed (default from settings)</li>
            <li>Set quantity and condition, then import</li>
          </ol>
        </div>
      </div>
      ) : (
        /* Bulk Import Mode */
        <div className="max-w-2xl">
          {/* Bulk Import Input */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              TCGPlayer Scanner Export
            </label>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="1 Card Name (Variant) [SET] 123&#10;1 Another Card [SET] 456&#10;..."
              rows={10}
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 font-mono text-sm"
            />
            <p className="text-slate-500 text-sm mt-2">
              Paste cards from TCGPlayer Scanner app. Format: quantity name [SET] number
            </p>
          </div>

          {/* Bulk Settings */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
            <h3 className="text-white font-medium mb-4">Import Settings</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Default Market Price *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-slate-400">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkDefaultPrice}
                    onChange={(e) => setBulkDefaultPrice(e.target.value)}
                    placeholder="1.00"
                    className="w-full pl-8 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <p className="text-slate-500 text-xs mt-1">Applied to all cards</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Condition
                </label>
                <select
                  value={bulkCondition}
                  onChange={(e) => setBulkCondition(e.target.value as "NEW" | "OPENED" | "USED")}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="NEW">New (Sealed)</option>
                  <option value="OPENED">Opened</option>
                  <option value="USED">Used</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-800/50 rounded-lg p-4">
              <div className="text-slate-300 text-sm font-medium mb-3">Discount:</div>
              <div className="flex gap-3">
                <select
                  value={bulkDiscountType}
                  onChange={(e) => setBulkDiscountType(e.target.value as "percentage" | "fixed")}
                  className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                >
                  <option value="percentage">Percentage (%)</option>
                  <option value="fixed">Fixed ($)</option>
                </select>
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={bulkDiscountValue}
                    onChange={(e) => setBulkDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm"
                  />
                  <span className="absolute right-3 top-2 text-slate-500 text-sm">
                    {bulkDiscountType === "percentage" ? "%" : "$"}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleBulkImport}
              disabled={isBulkImporting || !bulkText.trim() || !parseFloat(bulkDefaultPrice)}
              className="mt-6 w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg transition-all"
            >
              {isBulkImporting ? "Importing..." : "Bulk Import All Cards"}
            </button>
          </div>

          {/* Bulk Error */}
          {bulkError && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 mb-6 text-red-400">
              {bulkError}
            </div>
          )}

          {/* Bulk Success */}
          {bulkSuccess && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 mb-6 text-green-400">
              {bulkSuccess}
              <Link href="/admin/products" className="ml-2 underline">
                View Products
              </Link>
            </div>
          )}

          {/* Bulk Results */}
          {bulkResults.length > 0 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-6">
              <h3 className="text-white font-medium mb-4">Import Results</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {bulkResults.map((result, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${
                    result.status === 'success'
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}>
                    <span className={result.status === 'success' ? 'text-green-400' : 'text-red-400'}>
                      {result.name}
                    </span>
                    <span className={`text-sm ${result.status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                      {result.status === 'success' ? '✓' : `✗ ${result.error}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
            <h3 className="text-white font-medium mb-3">How to Bulk Import</h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-400 text-sm">
              <li>Use TCGPlayer Scanner app to scan your cards</li>
              <li>Export/copy the list (format: &quot;1 Card Name [SET] 123&quot;)</li>
              <li>Paste the entire list above</li>
              <li>Set default market price and discount</li>
              <li>Click &quot;Bulk Import All Cards&quot;</li>
            </ol>
            <div className="mt-4 p-3 bg-slate-800/50 rounded-lg">
              <p className="text-slate-300 text-xs font-mono mb-2">Example format:</p>
              <p className="text-slate-500 text-xs font-mono">1 Grim Tutor (Alternate Art) [M21] 315</p>
              <p className="text-slate-500 text-xs font-mono">1 Peer into the Abyss [M21] 117</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
