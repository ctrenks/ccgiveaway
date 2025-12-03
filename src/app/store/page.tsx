import { CardGrid } from "@/components/CardGrid";
import Link from "next/link";

// Sample data - in production, this would come from the database
const allCards = [
  {
    id: "1",
    name: "Black Lotus",
    slug: "black-lotus-alpha",
    price: "25000.00",
    rarity: "MYTHIC_RARE",
    condition: "NEAR_MINT",
    category: { name: "MTG", slug: "magic-the-gathering" },
    set: "Alpha",
  },
  {
    id: "2",
    name: "Charizard 1st Edition",
    slug: "charizard-1st-edition-base",
    price: "15000.00",
    rarity: "ULTRA_RARE",
    condition: "MINT",
    category: { name: "Pokémon", slug: "pokemon" },
    set: "Base Set",
  },
  {
    id: "3",
    name: "Blue-Eyes White Dragon",
    slug: "blue-eyes-white-dragon-lob",
    price: "850.00",
    rarity: "ULTRA_RARE",
    condition: "NEAR_MINT",
    category: { name: "Yu-Gi-Oh!", slug: "yu-gi-oh" },
    set: "Legend of Blue Eyes",
  },
  {
    id: "4",
    name: "Pikachu Illustrator",
    slug: "pikachu-illustrator-promo",
    price: "50000.00",
    rarity: "LEGENDARY",
    condition: "MINT",
    category: { name: "Pokémon", slug: "pokemon" },
    set: "Promo",
  },
  {
    id: "5",
    name: "Mox Sapphire",
    slug: "mox-sapphire-unlimited",
    price: "8500.00",
    rarity: "MYTHIC_RARE",
    condition: "EXCELLENT",
    category: { name: "MTG", slug: "magic-the-gathering" },
    set: "Unlimited",
  },
  {
    id: "6",
    name: "Dark Magician Girl",
    slug: "dark-magician-girl-mfc",
    price: "450.00",
    rarity: "ULTRA_RARE",
    condition: "NEAR_MINT",
    category: { name: "Yu-Gi-Oh!", slug: "yu-gi-oh" },
    set: "Magician's Force",
  },
  {
    id: "7",
    name: "Lugia 1st Edition",
    slug: "lugia-1st-edition-neo",
    price: "2800.00",
    rarity: "RARE",
    condition: "NEAR_MINT",
    category: { name: "Pokémon", slug: "pokemon" },
    set: "Neo Genesis",
  },
  {
    id: "8",
    name: "Ancestral Recall",
    slug: "ancestral-recall-beta",
    price: "12000.00",
    rarity: "MYTHIC_RARE",
    condition: "GOOD",
    category: { name: "MTG", slug: "magic-the-gathering" },
    set: "Beta",
  },
];

const categories = [
  { name: "All", slug: "" },
  { name: "Magic: The Gathering", slug: "magic-the-gathering" },
  { name: "Pokémon", slug: "pokemon" },
  { name: "Yu-Gi-Oh!", slug: "yu-gi-oh" },
  { name: "Sports", slug: "sports" },
];

const rarities = ["COMMON", "UNCOMMON", "RARE", "MYTHIC_RARE", "ULTRA_RARE", "SECRET_RARE", "LEGENDARY"];

export default function StorePage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Store</span>
          </nav>
          <h1 className="text-4xl font-bold text-white mb-4">Card Store</h1>
          <p className="text-slate-400 max-w-2xl">
            Browse our extensive collection of rare and collectible trading cards.
            Find your next treasure from Magic: The Gathering, Pokémon, Yu-Gi-Oh!, and more.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 shrink-0">
            <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-6 sticky top-24">
              <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>

              {/* Category Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Category</h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label key={cat.slug} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="category"
                        defaultChecked={cat.slug === ""}
                        className="w-4 h-4 text-purple-500 bg-slate-800 border-slate-600 focus:ring-purple-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-slate-300 group-hover:text-white transition-colors text-sm">
                        {cat.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Rarity Filter */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Rarity</h4>
                <div className="space-y-2">
                  {rarities.map((rarity) => (
                    <label key={rarity} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-purple-500 bg-slate-800 border-slate-600 rounded focus:ring-purple-500 focus:ring-offset-slate-900"
                      />
                      <span className="text-slate-300 group-hover:text-white transition-colors text-sm capitalize">
                        {rarity.replace("_", " ").toLowerCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-slate-400 mb-3">Price Range</h4>
                <div className="flex gap-3">
                  <input
                    type="number"
                    placeholder="Min"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              {/* Apply Button */}
              <button className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-medium rounded-xl transition-all">
                Apply Filters
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Sort & View Options */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-slate-400">
                Showing <span className="text-white font-medium">{allCards.length}</span> cards
              </p>
              <select className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50">
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name: A-Z</option>
              </select>
            </div>

            {/* Card Grid */}
            <CardGrid cards={allCards} />

            {/* Pagination */}
            <div className="mt-12 flex items-center justify-center gap-2">
              <button className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-purple-500/50 transition-all">
                Previous
              </button>
              {[1, 2, 3, 4, 5].map((page) => (
                <button
                  key={page}
                  className={`w-10 h-10 rounded-lg font-medium transition-all ${
                    page === 1
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                      : "bg-slate-800/50 border border-slate-700 text-slate-400 hover:text-white hover:border-purple-500/50"
                  }`}
                >
                  {page}
                </button>
              ))}
              <button className="px-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-purple-500/50 transition-all">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
