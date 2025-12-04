import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function clearTestData() {
  console.log("Clearing test products...");
  
  // Delete all products (they're test imports)
  const deleted = await prisma.product.deleteMany({});
  console.log(`Deleted ${deleted.count} products`);
  
  console.log("Done! Database is clean for real products.");
}

clearTestData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

