import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create default categories
  const categories = [
    { name: "Trading Cards", slug: "trading-cards", description: "Collectible trading card games and singles" },
    { name: "Toys", slug: "toys", description: "Action figures, plushies, and collectible toys" },
    { name: "Collectibles", slug: "collectibles", description: "Rare and vintage collectibles" },
    { name: "Sealed Products", slug: "sealed-products", description: "Factory sealed boxes, packs, and cases" },
    { name: "Accessories", slug: "accessories", description: "Card sleeves, deck boxes, playmats, and more" },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }
  console.log("✅ Categories created");

  // Create default subtypes (popular TCGs and brands)
  const subTypes = [
    "Magic The Gathering",
    "Pokemon",
    "Yu-Gi-Oh!",
    "One Piece",
    "Dragon Ball Super",
    "Disney Lorcana",
    "Flesh and Blood",
    "Star Wars Unlimited",
    "Sports Cards",
    "Marvel",
    "DC Comics",
    "Funko Pop",
    "LEGO",
    "Other",
  ];

  for (const name of subTypes) {
    await prisma.subType.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log("✅ SubTypes created");

  // Create default settings
  await prisma.settings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      discountType: "percentage",
      discountValue: 10, // 10% off TCGPlayer prices
      autoSyncEnabled: true,
      syncIntervalDays: 3,
    },
  });
  console.log("✅ Default settings created");

  console.log("🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

