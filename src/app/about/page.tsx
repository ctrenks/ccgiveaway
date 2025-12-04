import Link from "next/link";

export const metadata = {
  title: "About Us | Collector Card Giveaway",
  description: "Learn about Collector Card Giveaway - your destination for trading cards and exciting giveaways.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link href="/" className="hover:text-purple-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-white">About Us</span>
        </nav>

        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-white mb-8">About Collector Card Giveaway</h1>

          <div className="prose prose-invert prose-purple max-w-none space-y-6 text-slate-300">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Who We Are</h2>
              <p>
                Welcome to Collector Card Giveaway! We&apos;re passionate collectors and traders who 
                love bringing the excitement of trading card games to our community. Whether you&apos;re 
                into Magic: The Gathering, Pokémon, Yu-Gi-Oh!, or other collectible card games, 
                we&apos;ve got something for you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">What We Do</h2>
              <p>
                We offer two exciting ways to grow your collection:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-4">
                <li>
                  <strong className="text-purple-400">Card Store:</strong> Browse our curated selection 
                  of singles, sealed products, and accessories at competitive prices.
                </li>
                <li>
                  <strong className="text-purple-400">Giveaways:</strong> Participate in our unique 
                  lottery-style giveaways where you can win booster packs, boxes, and rare cards. 
                  Every giveaway includes free entries - no purchase necessary!
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Our Giveaway System</h2>
              <p>
                What makes us different? Our giveaways are based on the Ohio Lottery Pick 3 numbers, 
                ensuring completely fair and transparent results. Here&apos;s how it works:
              </p>
              <ol className="list-decimal list-inside space-y-2 mt-4">
                <li>Each giveaway features a product (like a booster box) divided into slots</li>
                <li>You pick a slot and a 3-digit number (000-999)</li>
                <li>When enough people enter, a draw date is set</li>
                <li>The Ohio Pick 3 Evening number determines winners</li>
                <li>Closest number to the Pick 3 wins each slot!</li>
              </ol>
              <p className="mt-4">
                Everyone gets free entries to every giveaway. Want more chances? Earn Giveaway Credits 
                by shopping in our store!
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Our Commitment</h2>
              <ul className="list-disc list-inside space-y-2">
                <li><strong>Fair Play:</strong> Our lottery-based system ensures transparent, verifiable results</li>
                <li><strong>Quality Products:</strong> We only sell authentic, verified cards and sealed products</li>
                <li><strong>Community First:</strong> Free entries on every giveaway - everyone can participate</li>
                <li><strong>Fast Shipping:</strong> Orders are processed quickly and shipped securely</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">Get In Touch</h2>
              <p>
                Have questions or feedback? We&apos;d love to hear from you! Visit our{" "}
                <Link href="/contact" className="text-purple-400 hover:text-purple-300 underline">
                  contact page
                </Link>{" "}
                to send us a message.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

