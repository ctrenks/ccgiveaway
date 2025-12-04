import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-slate-950 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <span className="text-xl">✨</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Collector Card
              </span>
            </Link>
            <p className="text-slate-500 text-sm">
              Your premier destination for rare and collectible trading cards.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {["Store", "Categories", "Giveaways", "About"].map((link) => (
                <li key={link}>
                  <Link href={`/${link.toLowerCase()}`} className="text-slate-500 hover:text-purple-400 transition-colors text-sm">
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Browse */}
          <div>
            <h4 className="text-white font-semibold mb-4">Browse</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/store" className="text-slate-500 hover:text-purple-400 transition-colors text-sm">
                  All Products
                </Link>
              </li>
              <li>
                <Link href="/store?category=trading-cards" className="text-slate-500 hover:text-purple-400 transition-colors text-sm">
                  Trading Cards
                </Link>
              </li>
              <li>
                <Link href="/giveaways" className="text-slate-500 hover:text-purple-400 transition-colors text-sm">
                  Current Giveaways
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>support@collectorcaredgiveaway.com</li>
              <li>
                <div className="flex gap-4 mt-4">
                  {/* Social Icons */}
                  {["twitter", "instagram", "discord"].map((social) => (
                    <a
                      key={social}
                      href={`https://${social}.com`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center hover:bg-purple-500/20 hover:text-purple-400 transition-all"
                    >
                      {social === "twitter" && "𝕏"}
                      {social === "instagram" && "📷"}
                      {social === "discord" && "💬"}
                    </a>
                  ))}
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-slate-600 text-sm">
            © {new Date().getFullYear()} Collector Card Giveaway. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="/privacy" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-slate-600 hover:text-slate-400 text-sm transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
