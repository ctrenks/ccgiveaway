"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface StoreSortFilterProps {
  productCount: number;
  currentSort: string;
}

export default function StoreSortFilter({ productCount, currentSort }: StoreSortFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSortChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === "newest") {
      params.delete("sort");
    } else {
      params.set("sort", value);
    }
    
    const queryString = params.toString();
    router.push(`/store${queryString ? `?${queryString}` : ""}`);
  };

  return (
    <div className="mb-6 flex items-center justify-between">
      <p className="text-slate-400 text-sm">
        {productCount} {productCount === 1 ? "product" : "products"}
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="sort" className="text-slate-400 text-sm">Sort by:</label>
        <select
          id="sort"
          value={currentSort}
          onChange={(e) => handleSortChange(e.target.value)}
          className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500 cursor-pointer"
        >
          <option value="newest">Newest First</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
          <option value="name-asc">Name: A to Z</option>
          <option value="name-desc">Name: Z to A</option>
        </select>
      </div>
    </div>
  );
}

