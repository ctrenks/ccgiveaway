"use client";

interface ManaSymbolsProps {
  manaCost: string;
  size?: "sm" | "md" | "lg";
}

// Parse mana cost string like "{3}{U}{B}" into individual symbols
function parseManaCost(manaCost: string): string[] {
  const symbols = manaCost.match(/\{[^}]+\}/g) || [];
  return symbols.map(s => s.replace(/[{}]/g, ''));
}

// Get mana font class for a symbol
function getManaClass(symbol: string): string {
  const sym = symbol.toLowerCase();
  
  // Numbers
  if (/^\d+$/.test(sym)) {
    return `ms ms-${sym}`;
  }
  
  // Colors
  const colorMap: Record<string, string> = {
    'w': 'w',
    'u': 'u',
    'b': 'b',
    'r': 'r',
    'g': 'g',
    'c': 'c',
  };
  
  if (colorMap[sym]) {
    return `ms ms-${colorMap[sym]}`;
  }
  
  // Special symbols
  if (sym === 'x') return 'ms ms-x';
  if (sym === 't') return 'ms ms-tap';
  if (sym === 'q') return 'ms ms-untap';
  
  // Hybrid mana (e.g., "W/U")
  if (sym.includes('/')) {
    const parts = sym.split('/');
    if (parts[1] === 'p') {
      return `ms ms-${parts[0]}p`; // Phyrexian
    }
    return `ms ms-${parts[0]}${parts[1]}`; // Hybrid
  }
  
  // Default fallback
  return `ms ms-${sym}`;
}

export default function ManaSymbols({ manaCost, size = "md" }: ManaSymbolsProps) {
  const symbols = parseManaCost(manaCost);
  
  const sizeClasses = {
    sm: "ms-cost ms-shadow",
    md: "ms-cost ms-shadow",
    lg: "ms-cost ms-shadow",
  };
  
  const customSizes = {
    sm: { fontSize: '1.25rem' }, // 20px
    md: { fontSize: '1.75rem' }, // 28px
    lg: { fontSize: '2.25rem' }, // 36px
  };

  if (symbols.length === 0) {
    return <span className="text-slate-500 italic">No mana cost</span>;
  }

  return (
    <div className="flex items-center gap-0 flex-wrap">
      {symbols.map((symbol, index) => (
        <i
          key={index}
          className={`${getManaClass(symbol)} ${sizeClasses[size]}`}
          style={customSizes[size]}
          title={symbol}
        />
      ))}
    </div>
  );
}

