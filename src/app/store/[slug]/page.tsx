import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import AddToCartButton from "@/components/AddToCartButton";
import { auth } from "@/lib/auth";

interface ProductPageProps {
  params: {
    slug: string;
  };
}

async function getProduct(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug, active: true },
    include: {
      category: true,
      subType: true,
    },
  });

  return product;
}

function getCreditsForProduct(price: number): number {
  const creditsPerDollar = 1.0;
  const credits = Math.floor(price * creditsPerDollar);
  return Math.max(1, credits);
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getProduct(params.slug);

  if (!product) {
    return {
      title: "Product Not Found",
    };
  }

  const price = Number(product.price);
  const title = `${product.name}${product.setName ? ` - ${product.setName}` : ""} - $${price.toFixed(2)}`;
  const description = product.description || `Buy ${product.name} from our store. ${product.setName ? `Set: ${product.setName}. ` : ""}In stock and ready to ship!`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: product.image ? [product.image] : [],
    },
  };
}

function generateFAQ(product: any) {
  const faqs = [];

  // Magic card specific FAQs
  if (product.subType?.name === "Magic The Gathering") {
    if (product.manaCost) {
      // Parse mana cost to determine colors
      const colors = [];
      if (product.manaCost.includes("{W}")) colors.push("White");
      if (product.manaCost.includes("{U}")) colors.push("Blue");
      if (product.manaCost.includes("{B}")) colors.push("Black");
      if (product.manaCost.includes("{R}")) colors.push("Red");
      if (product.manaCost.includes("{G}")) colors.push("Green");

      faqs.push({
        question: "What is the mana cost to cast this card?",
        answer: `The mana cost is ${product.manaCost}.${colors.length > 0 ? ` This card uses ${colors.join(", ")} mana.` : ""}`,
      });

      if (colors.length > 0) {
        faqs.push({
          question: "What colors does this card require?",
          answer: `This card requires ${colors.join(" and ")} mana, making it ${colors.length === 1 ? "a mono-color" : "a multi-color"} card.`,
        });
      }
    }

    if (product.cardType) {
      faqs.push({
        question: "What type of card is this?",
        answer: `This is a ${product.cardType}.`,
      });
    }

    if (product.powerToughness && product.cardType?.toLowerCase().includes("creature")) {
      faqs.push({
        question: "What are this creature's power and toughness?",
        answer: `This creature has ${product.powerToughness} power/toughness.`,
      });
    }

    if (product.legality) {
      faqs.push({
        question: "What formats is this card legal in?",
        answer: `This card is legal in: ${product.legality}.`,
      });
    }
  }

  // General card FAQs
  if (product.setName) {
    faqs.push({
      question: "What set is this card from?",
      answer: `This card is from the ${product.setName} set.`,
    });
  }

  if (product.cardNumber) {
    faqs.push({
      question: "What is the collector number?",
      answer: `The collector number is ${product.cardNumber}.`,
    });
  }

  if (product.rarity) {
    faqs.push({
      question: "What is the rarity of this card?",
      answer: `This card is ${product.rarity}.`,
    });
  }

  if (product.isFoil) {
    faqs.push({
      question: "Is this card foil?",
      answer: "Yes, this is a foil version of the card with a holographic finish.",
    });
  }

  if (product.artist) {
    faqs.push({
      question: "Who is the artist?",
      answer: `This card was illustrated by ${product.artist}.`,
    });
  }

  // Condition FAQ
  faqs.push({
    question: "What condition is this card in?",
    answer: `This card is in ${product.condition === "NEW" ? "Near Mint/New" : product.condition === "OPENED" ? "Lightly Played/Opened" : "Played"} condition.`,
  });

  // Shipping FAQ
  faqs.push({
    question: "Do you ship to my location?",
    answer: "We currently ship within the USA only. VIP members receive free shipping once per month between the 20th-28th.",
  });

  return faqs;
}

function generateStructuredData(product: any, faqs: any[]) {
  const price = Number(product.price);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;

  const productData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description || `${product.name}${product.setName ? ` from ${product.setName}` : ""}`,
    image: product.image || "",
    brand: {
      "@type": "Brand",
      name: product.subType?.name || "Trading Cards",
    },
    offers: {
      "@type": "Offer",
      price: price.toFixed(2),
      priceCurrency: "USD",
      availability: product.quantity > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: product.condition === "NEW" ? "https://schema.org/NewCondition" : "https://schema.org/UsedCondition",
    },
  };

  if (originalPrice && originalPrice > price) {
    (productData.offers as any).priceValidUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  const faqData = faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : null;

  return { productData, faqData };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  const session = await auth();
  const price = Number(product.price);
  const originalPrice = product.originalPrice ? Number(product.originalPrice) : null;
  const discount = originalPrice && originalPrice > price ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const credits = getCreditsForProduct(price);
  const faqs = generateFAQ(product);
  const { productData, faqData } = generateStructuredData(product, faqs);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productData) }}
      />
      {faqData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData) }}
        />
      )}

      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <nav className="flex text-sm text-slate-400">
              <Link href="/" className="hover:text-purple-400 transition">Home</Link>
              <span className="mx-2">/</span>
              <Link href="/store" className="hover:text-purple-400 transition">Store</Link>
              <span className="mx-2">/</span>
              <span className="text-slate-300">{product.name}</span>
            </nav>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Image */}
            <div className="space-y-4">
              <div className="relative aspect-[3/4] bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-contain p-4"
                    priority
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-600">
                    No image available
                  </div>
                )}
                {product.isFoil && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    ✨ FOIL
                  </div>
                )}
                {discount > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    {discount}% OFF
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Details */}
            <div className="space-y-6">
              {/* Title & Price */}
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{product.name}</h1>
                {product.setName && (
                  <p className="text-lg text-slate-400 mb-4">
                    <span className="text-purple-400">Set:</span> {product.setName}
                    {product.cardNumber && <span className="ml-2 text-slate-500">#{product.cardNumber}</span>}
                  </p>
                )}

                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-4xl font-bold text-white">${price.toFixed(2)}</span>
                  {originalPrice && originalPrice > price && (
                    <span className="text-xl text-slate-500 line-through">${originalPrice.toFixed(2)}</span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span className="text-purple-400">✨ Earn {credits} giveaway credits</span>
                  <span className="text-slate-600">•</span>
                  <span className={product.quantity > 0 ? "text-green-400" : "text-red-400"}>
                    {product.quantity > 0 ? `${product.quantity} in stock` : "Out of stock"}
                  </span>
                </div>
              </div>

              {/* Card Details */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 space-y-4">
                <h2 className="text-xl font-semibold text-white mb-4">Card Details</h2>

                {product.cardType && (
                  <div>
                    <span className="text-slate-400 text-sm">Type:</span>
                    <p className="text-white">{product.cardType}</p>
                  </div>
                )}

                {product.manaCost && (
                  <div>
                    <span className="text-slate-400 text-sm">Mana Cost:</span>
                    <p className="text-white font-mono text-lg">{product.manaCost}</p>
                  </div>
                )}

                {product.powerToughness && (
                  <div>
                    <span className="text-slate-400 text-sm">Power / Toughness:</span>
                    <p className="text-white font-bold text-lg">{product.powerToughness}</p>
                  </div>
                )}

                {product.description && (
                  <div>
                    <span className="text-slate-400 text-sm">Card Text:</span>
                    <p className="text-white italic">{product.description}</p>
                  </div>
                )}

                {product.rarity && (
                  <div>
                    <span className="text-slate-400 text-sm">Rarity:</span>
                    <p className="text-white">{product.rarity}</p>
                  </div>
                )}

                {product.legality && (
                  <div>
                    <span className="text-slate-400 text-sm">Legality:</span>
                    <p className="text-white">{product.legality}</p>
                  </div>
                )}

                {product.artist && (
                  <div>
                    <span className="text-slate-400 text-sm">Artist:</span>
                    <p className="text-white">{product.artist}</p>
                  </div>
                )}

                <div>
                  <span className="text-slate-400 text-sm">Condition:</span>
                  <p className="text-white">
                    {product.condition === "NEW" ? "Near Mint / New" :
                     product.condition === "OPENED" ? "Lightly Played / Opened" : "Played"}
                  </p>
                </div>

                {product.isFoil && (
                  <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 border border-purple-500/30 rounded-lg p-3">
                    <span className="text-purple-300">✨ This is a foil version with holographic finish</span>
                  </div>
                )}
              </div>

              {/* Add to Cart */}
              <div className="space-y-4">
                {product.quantity > 0 ? (
                  <AddToCartButton
                    product={{
                      id: product.id,
                      name: product.name,
                      price: price,
                      image: product.image,
                      quantity: product.quantity,
                    }}
                    className="w-full"
                  />
                ) : (
                  <button
                    disabled
                    className="w-full py-4 bg-slate-700 text-slate-400 rounded-lg font-semibold cursor-not-allowed"
                  >
                    Out of Stock
                  </button>
                )}

                <div className="text-center text-sm text-slate-400">
                  <p>🚚 USA shipping only • VIP members get free shipping monthly</p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          {faqs.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-6"
                  >
                    <h3 className="text-lg font-semibold text-white mb-2">{faq.question}</h3>
                    <p className="text-slate-300">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
