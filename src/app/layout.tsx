import type { Metadata } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

const outfit = Outfit({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Collector Card Giveaway | Rare Trading Cards & Giveaways",
  description: "Your premier destination for rare and collectible trading cards. Magic: The Gathering, Pokémon, Yu-Gi-Oh! and more. Enter our exclusive giveaways!",
  keywords: ["trading cards", "collector cards", "magic the gathering", "pokemon cards", "yu-gi-oh", "card giveaways", "rare cards"],
  authors: [{ name: "Collector Card Giveaway" }],
  openGraph: {
    title: "Collector Card Giveaway",
    description: "Discover rare collector cards and enter exclusive giveaways",
    url: "https://collectorcaredgiveaway.com",
    siteName: "Collector Card Giveaway",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${jetbrainsMono.variable} antialiased`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 pt-16">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
