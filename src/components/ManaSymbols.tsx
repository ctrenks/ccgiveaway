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

// Color mapping for mana symbols
const colorMap: Record<string, { bg: string; text: string; border: string }> = {
  W: { bg: "bg-yellow-50", text: "text-yellow-900", border: "border-yellow-400" },
  U: { bg: "bg-blue-500", text: "text-white", border: "border-blue-600" },
  B: { bg: "bg-gray-900", text: "text-white", border: "border-gray-700" },
  R: { bg: "bg-red-500", text: "text-white", border: "border-red-600" },
  G: { bg: "bg-green-600", text: "text-white", border: "border-green-700" },
  C: { bg: "bg-gray-400", text: "text-gray-900", border: "border-gray-500" },
};

// Get symbol display
function getSymbolStyle(symbol: string) {
  // Check if it's a number (generic mana)
  if (/^\d+$/.test(symbol)) {
    return { bg: "bg-gray-300", text: "text-gray-800", border: "border-gray-400", display: symbol };
  }

  // Check if it's a hybrid mana (e.g., "W/U")
  if (symbol.includes('/')) {
    const [color1, color2] = symbol.split('/');
    return { 
      bg: `bg-gradient-to-br from-${colorMap[color1]?.bg.split('-')[1] || 'gray'}-500 to-${colorMap[color2]?.bg.split('-')[1] || 'gray'}-500`, 
      text: "text-white", 
      border: "border-gray-500", 
      display: symbol.replace('/', ''),
      isHybrid: true
    };
  }

  // Check if it's Phyrexian mana (e.g., "W/P")
  if (symbol.includes('P')) {
    const color = symbol.replace('/P', '');
    return { 
      ...colorMap[color], 
      display: 'Φ',
      isPhyrexian: true
    };
  }

  // Colored mana
  if (colorMap[symbol]) {
    return { ...colorMap[symbol], display: symbol };
  }

  // X or other special
  if (symbol === 'X') {
    return { bg: "bg-orange-500", text: "text-white", border: "border-orange-600", display: 'X' };
  }

  // Tap symbol
  if (symbol === 'T') {
    return { bg: "bg-gray-300", text: "text-gray-800", border: "border-gray-400", display: '⟳' };
  }

  // Default fallback
  return { bg: "bg-gray-300", text: "text-gray-700", border: "border-gray-400", display: symbol };
}

export default function ManaSymbols({ manaCost, size = "md" }: ManaSymbolsProps) {
  const symbols = parseManaCost(manaCost);
  
  const sizeClasses = {
    sm: "w-5 h-5 text-xs",
    md: "w-7 h-7 text-sm",
    lg: "w-9 h-9 text-base",
  };

  if (symbols.length === 0) {
    return <span className="text-slate-500 italic">No mana cost</span>;
  }

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {symbols.map((symbol, index) => {
        const style = getSymbolStyle(symbol);
        return (
          <div
            key={index}
            className={`
              ${sizeClasses[size]}
              ${style.bg}
              ${style.text}
              border-2 ${style.border}
              rounded-full
              flex items-center justify-center
              font-bold
              shadow-sm
              flex-shrink-0
            `}
            title={symbol}
          >
            {style.display}
          </div>
        );
      })}
    </div>
  );
}

