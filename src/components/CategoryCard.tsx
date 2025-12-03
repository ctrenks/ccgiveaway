import Image from "next/image";
import Link from "next/link";

interface CategoryCardProps {
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  cardCount?: number;
}

const categoryIcons: Record<string, string> = {
  "magic-the-gathering": "🧙‍♂️",
  "pokemon": "⚡",
  "yu-gi-oh": "👁️",
  "sports": "🏀",
  "other": "🎴",
};

export function CategoryCard({ name, slug, description, image, cardCount }: CategoryCardProps) {
  const icon = categoryIcons[slug] || "🎴";

  return (
    <Link href={`/categories/${slug}`} className="group block">
      <div className="relative h-64 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl overflow-hidden border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20">
        {/* Background Image */}
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover opacity-40 group-hover:opacity-60 group-hover:scale-110 transition-all duration-500"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/30 to-pink-900/30" />
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 p-6 flex flex-col justify-end">
          <div className="text-4xl mb-3">{icon}</div>
          <h3 className="text-2xl font-bold text-white mb-1 group-hover:text-purple-400 transition-colors">
            {name}
          </h3>
          {description && (
            <p className="text-slate-400 text-sm line-clamp-2 mb-2">{description}</p>
          )}
          {cardCount !== undefined && (
            <p className="text-sm text-purple-400 font-medium">{cardCount} cards available</p>
          )}
        </div>

        {/* Hover Arrow */}
        <div className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:translate-x-1">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
