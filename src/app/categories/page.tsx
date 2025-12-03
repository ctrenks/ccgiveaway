import { CategoryCard } from "@/components/CategoryCard";
import Link from "next/link";

const categories = [
  {
    name: "Magic: The Gathering",
    slug: "magic-the-gathering",
    description: "From Alpha to the latest sets. Find your next powerful planeswalker, rare lands, and game-changing spells.",
    cardCount: 2500,
  },
  {
    name: "Pokémon",
    slug: "pokemon",
    description: "Gotta catch 'em all! Discover rare holos, vintage cards, and modern hits from every generation.",
    cardCount: 1800,
  },
  {
    name: "Yu-Gi-Oh!",
    slug: "yu-gi-oh",
    description: "It's time to duel! Legendary dragons, powerful spell cards, and tournament-winning decks await.",
    cardCount: 1200,
  },
  {
    name: "Sports Cards",
    slug: "sports",
    description: "Basketball, football, baseball rookies and legendary players. From vintage to modern releases.",
    cardCount: 3000,
  },
  {
    name: "Dragon Ball",
    slug: "dragon-ball",
    description: "Power up your collection with cards from the Dragon Ball Super Card Game and classics.",
    cardCount: 600,
  },
  {
    name: "One Piece",
    slug: "one-piece",
    description: "Set sail with the Straw Hat crew! Cards from the One Piece Card Game.",
    cardCount: 450,
  },
  {
    name: "Flesh and Blood",
    slug: "flesh-and-blood",
    description: "The modern hero-battling TCG with stunning art and competitive gameplay.",
    cardCount: 300,
  },
  {
    name: "Disney Lorcana",
    slug: "disney-lorcana",
    description: "Disney's magical trading card game featuring beloved characters from across their universe.",
    cardCount: 250,
  },
];

export default function CategoriesPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <nav className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <Link href="/" className="hover:text-purple-400 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white">Categories</span>
          </nav>
          <h1 className="text-4xl font-bold text-white mb-4">Browse by Category</h1>
          <p className="text-slate-400 max-w-2xl">
            Explore our extensive collection organized by trading card game.
            From classic collectibles to the latest releases.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category) => (
            <CategoryCard key={category.slug} {...category} />
          ))}
        </div>

        {/* Info Section */}
        <section className="mt-20 bg-gradient-to-br from-slate-900/50 to-purple-900/20 rounded-3xl border border-purple-500/10 p-8 md:p-12">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Looking for Something Specific?</h2>
            <p className="text-slate-400 mb-8">
              Can&apos;t find what you&apos;re looking for? We&apos;re constantly adding new cards to our collection.
              Let us know what you&apos;re searching for and we&apos;ll help you find it!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/store"
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-xl shadow-lg transition-all"
              >
                Browse All Cards
              </Link>
              <Link
                href="/contact"
                className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800 text-white font-semibold rounded-xl border border-slate-700 hover:border-purple-500/50 transition-all"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
