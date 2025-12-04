"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  price: string;
  originalPrice: string | null;
  quantity: number;
  setName: string | null;
  cardNumber: string | null;
  condition: string | null;
  rarity: string | null;
  featured: boolean;
  active: boolean;
  giveawayCredits: number | null;
  tcgPlayerId: string | null;
  tcgPlayerUrl: string | null;
  category: { id: string; name: string };
  subType: { id: string; name: string } | null;
}

interface Category {
  id: string;
  name: string;
}

interface SubType {
  id: string;
  name: string;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subTypes, setSubTypes] = useState<SubType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [setNameField, setSetNameField] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [condition, setCondition] = useState("NEW");
  const [rarity, setRarity] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [subTypeId, setSubTypeId] = useState("");
  const [featured, setFeatured] = useState(false);
  const [active, setActive] = useState(true);
  const [giveawayCredits, setGiveawayCredits] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    fetchProduct();
    fetchCategories();
    fetchSubTypes();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      if (!res.ok) throw new Error("Product not found");
      const data = await res.json();
      setProduct(data.product);

      // Populate form
      setName(data.product.name || "");
      setDescription(data.product.description || "");
      setPrice(data.product.price || "");
      setOriginalPrice(data.product.originalPrice || "");
      setQuantity(data.product.quantity || 0);
      setSetNameField(data.product.setName || "");
      setCardNumber(data.product.cardNumber || "");
      setCondition(data.product.condition || "NEW");
      setRarity(data.product.rarity || "");
      setCategoryId(data.product.category?.id || "");
      setSubTypeId(data.product.subType?.id || "");
      setFeatured(data.product.featured || false);
      setActive(data.product.active ?? true);
      setGiveawayCredits(data.product.giveawayCredits?.toString() || "");
      setImageUrl(data.product.image || "");
    } catch (error) {
      console.error("Error fetching product:", error);
      setMessage({ type: "error", text: "Product not found" });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
  };

  const fetchSubTypes = async () => {
    const res = await fetch("/api/admin/subtypes");
    const data = await res.json();
    setSubTypes(data.subTypes || []);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const { url } = await res.json();
        setImageUrl(url);
        setMessage({ type: "success", text: "Image uploaded!" });
      } else {
        throw new Error("Upload failed");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to upload image" });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          image: imageUrl || null,
          price: parseFloat(price) || 0,
          originalPrice: originalPrice ? parseFloat(originalPrice) : null,
          quantity,
          setName: setNameField || null,
          cardNumber: cardNumber || null,
          condition,
          rarity: rarity || null,
          categoryId,
          subTypeId: subTypeId || null,
          featured,
          active,
          giveawayCredits: giveawayCredits ? parseInt(giveawayCredits) : null,
        }),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Product saved!" });
        fetchProduct();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Save failed");
      }
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Save failed" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        router.push("/admin/products");
      } else {
        throw new Error("Delete failed");
      }
    } catch {
      setMessage({ type: "error", text: "Failed to delete product" });
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Product not found</p>
        <Link href="/admin/products" className="text-purple-400 hover:underline">
          ← Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/admin/products" className="text-slate-400 hover:text-white">
            ← Back
          </Link>
          <h1 className="text-3xl font-bold text-white">Edit Product</h1>
        </div>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="px-4 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 text-white rounded-lg"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Basic Info</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Set Name</label>
                  <input
                    type="text"
                    value={setNameField}
                    onChange={(e) => setSetNameField(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Card #</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Pricing & Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Your Price *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Original Price</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Giveaway Credits</label>
                <input
                  type="number"
                  value={giveawayCredits}
                  onChange={(e) => setGiveawayCredits(e.target.value)}
                  placeholder="Auto"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Condition</label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="NEW">New (Sealed)</option>
                  <option value="OPENED">Opened</option>
                  <option value="USED">Used</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Rarity</label>
                <input
                  type="text"
                  value={rarity}
                  onChange={(e) => setRarity(e.target.value)}
                  placeholder="e.g., Rare, Mythic Rare"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">SubType</label>
                <select
                  value={subTypeId}
                  onChange={(e) => setSubTypeId(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
                >
                  <option value="">None</option>
                  {subTypes.map((st) => (
                    <option key={st.id} value={st.id}>{st.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Image */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Image</h2>
            <div className="aspect-[3/4] bg-slate-800 rounded-lg overflow-hidden mb-4">
              {imageUrl ? (
                <Image src={imageUrl} alt={name} width={300} height={400} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-slate-600">🃏</div>
              )}
            </div>
            <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingImage}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg"
            >
              {uploadingImage ? "Uploading..." : "Change Image"}
            </button>
          </div>

          {/* Status */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Status</h2>
            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-white">Active (visible in store)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-5 h-5 rounded"
                />
                <span className="text-white">Featured</span>
              </label>
            </div>
          </div>

          {/* TCGPlayer */}
          {product.tcgPlayerUrl && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h2 className="text-lg font-semibold text-white mb-4">TCGPlayer</h2>
              <a
                href={product.tcgPlayerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:underline text-sm break-all"
              >
                View on TCGPlayer →
              </a>
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold rounded-xl"
          >
            {isSaving ? "Saving..." : "Save Changes"}
          </button>

          {/* Message */}
          {message.text && (
            <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
              {message.text}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
