"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

interface AddToCartButtonProps {
  product: {
    id: string;
    name: string;
    price: number;
    image: string | null;
    quantity: number; // Available stock
  };
  className?: string;
}

export default function AddToCartButton({ product, className = "" }: AddToCartButtonProps) {
  const { addItem, items } = useCart();
  const [added, setAdded] = useState(false);

  const cartItem = items.find((item) => item.id === product.id);
  const inCart = cartItem?.quantity || 0;
  const canAdd = inCart < product.quantity;

  const handleAdd = () => {
    if (!canAdd) return;
    
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      maxQuantity: product.quantity,
    });
    
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (product.quantity <= 0) {
    return (
      <button
        disabled
        className={`px-4 py-2 bg-slate-700 text-slate-500 rounded-lg cursor-not-allowed ${className}`}
      >
        Out of Stock
      </button>
    );
  }

  return (
    <button
      onClick={handleAdd}
      disabled={!canAdd}
      className={`px-4 py-2 font-medium rounded-lg transition-all ${
        added
          ? "bg-green-600 text-white"
          : canAdd
          ? "bg-purple-600 hover:bg-purple-500 text-white"
          : "bg-slate-700 text-slate-500 cursor-not-allowed"
      } ${className}`}
    >
      {added ? "✓ Added!" : !canAdd ? "Max in Cart" : "Add to Cart"}
    </button>
  );
}

