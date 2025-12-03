import { Hero } from "@/components/Hero";
import { CategoryCard } from "@/components/CategoryCard";
import { CardGrid } from "@/components/CardGrid";
import Link from "next/link";

// Sample data - in production, this would come from the database
const featuredCategories = [
  {
    name: "Magic: The Gathering",
    slug: "magic-the-gathering",
    description: "From Alpha to the latest sets. Find your next powerful planeswalker.",
    cardCount: 2500,
  },
  {
    name: "Pokémon",
    slug: "pokemon",
    description: "Gotta catch 'em all! Rare holos, vintage cards, and modern hits.",
    cardCount: 1800,
  },
  {
    name: "Yu-Gi-Oh!",
    slug: "yu-gi-oh",
    description: "It's time to duel! Legendary dragons and powerful spell cards.",
    cardCount: 1200,
  },
  {
    name: "Sports Cards",
    slug: "sports",
    description: "Basketball, football, baseball rookies and legendary players.",
    cardCount: 3000,
  },
];

const featuredCards = [
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
];

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero />

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Browse Categories</h2>
            <p className="text-slate-400">Explore our collection by card type</p>
          </div>
          <Link
            href="/categories"
            className="hidden sm:flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
          >
            View All
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredCategories.map((category) => (
            <CategoryCard key={category.slug} {...category} />
          ))}
        </div>
      </section>

      {/* Featured Cards Section */}
      <section className="bg-gradient-to-b from-transparent via-purple-950/20 to-transparent py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">Featured Cards</h2>
              <p className="text-slate-400">Hand-picked rare finds from our collection</p>
            </div>
            <Link
              href="/store"
              className="hidden sm:flex items-center gap-2 text-purple-400 hover:text-purple-300 transition-colors font-medium"
            >
              View Store
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <CardGrid cards={featuredCards} />
        </div>
      </section>

      {/* Giveaway CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="relative overflow-hidden bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-3xl p-8 md:p-12 border border-purple-500/20">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-4">
                <span className="text-2xl">🎁</span>
                <span className="text-sm font-medium text-white">Weekly Giveaways</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Win Rare Cards Every Week!
              </h2>
              <p className="text-slate-300 max-w-lg">
                Enter our exclusive giveaways for a chance to win rare and valuable collector cards.
                New giveaways every week – it&apos;s free to enter!
              </p>
            </div>
            <Link
              href="/giveaways"
              className="shrink-0 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all flex items-center gap-2 text-lg"
            >
              <span>Enter Now</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-slate-900/50 py-20 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Stay in the Loop</h2>
          <p className="text-slate-400 mb-8">
            Get notified about new arrivals, exclusive deals, and upcoming giveaways.
          </p>
          <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg transition-all"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
