import Image from "next/image";
import Link from "next/link";

interface CardItem {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  price: string | number;
  rarity: string;
  condition: string;
  category: {
    name: string;
    slug: string;
  };
  set?: string | null;
}

interface CardGridProps {
  cards: CardItem[];
  title?: string;
}

const rarityColors: Record<string, string> = {
  COMMON: "from-slate-400 to-slate-500",
  UNCOMMON: "from-green-400 to-emerald-500",
  RARE: "from-blue-400 to-cyan-500",
  MYTHIC_RARE: "from-orange-400 to-red-500",
  ULTRA_RARE: "from-purple-400 to-pink-500",
  SECRET_RARE: "from-yellow-400 to-amber-500",
  LEGENDARY: "from-amber-400 to-orange-600",
};

const conditionLabels: Record<string, string> = {
  MINT: "Mint",
  NEAR_MINT: "Near Mint",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  PLAYED: "Played",
  POOR: "Poor",
};

export function CardGrid({ cards, title }: CardGridProps) {
  return (
    <section>
      {title && (
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <Link
            key={card.id}
            href={`/cards/${card.slug}`}
            className="group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/50 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1">
              {/* Card Image */}
              <div className="relative aspect-[3/4] bg-slate-800 overflow-hidden">
                {card.image ? (
                  <Image
                    src={card.image}
                    alt={card.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-6xl opacity-30">🃏</div>
                  </div>
                )}
                {/* Rarity Badge */}
                <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${rarityColors[card.rarity] || rarityColors.COMMON} shadow-lg`}>
                  {card.rarity.replace("_", " ")}
                </div>
                {/* Category Badge */}
                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full text-xs font-medium text-white bg-black/50 backdrop-blur-sm">
                  {card.category.name}
                </div>
              </div>

              {/* Card Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold text-white mb-1 line-clamp-1 group-hover:text-purple-400 transition-colors">
                  {card.name}
                </h3>
                {card.set && (
                  <p className="text-sm text-slate-500 mb-2">{card.set}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">
                    {conditionLabels[card.condition] || card.condition}
                  </span>
                  <span className="text-xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                    ${typeof card.price === "string" ? parseFloat(card.price).toFixed(2) : card.price.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
