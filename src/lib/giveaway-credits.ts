import { prisma } from "@/lib/prisma";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number | string;
  product?: {
    giveawayCredits?: number | null;
  };
}

interface CreditCalculation {
  totalCredits: number;
  breakdown: Array<{
    productId: string;
    credits: number;
    source: "manual" | "calculated";
  }>;
}

/**
 * Calculate giveaway credits for an order
 * - If product has manual giveawayCredits set, use that
 * - Otherwise, calculate based on settings (e.g., 1 credit per $10)
 */
export async function calculateOrderCredits(
  orderItems: OrderItem[],
  orderTotal?: number
): Promise<CreditCalculation> {
  const settings = await prisma.settings.findUnique({
    where: { id: "default" },
  });

  // If credits are disabled, return 0
  if (settings && !settings.giveawayCreditsEnabled) {
    return { totalCredits: 0, breakdown: [] };
  }

  const creditsPerDollar = settings?.giveawayCreditsPerDollar
    ? Number(settings.giveawayCreditsPerDollar)
    : 0.1; // Default: 1 credit per $10

  const breakdown: CreditCalculation["breakdown"] = [];
  let totalCredits = 0;

  for (const item of orderItems) {
    const itemPrice = Number(item.price) * item.quantity;

    // Check if product has manual credits override
    if (item.product?.giveawayCredits !== null && item.product?.giveawayCredits !== undefined) {
      const credits = item.product.giveawayCredits * item.quantity;
      totalCredits += credits;
      breakdown.push({
        productId: item.productId,
        credits,
        source: "manual",
      });
    } else {
      // Calculate based on price
      const credits = Math.floor(itemPrice * creditsPerDollar);
      totalCredits += credits;
      breakdown.push({
        productId: item.productId,
        credits,
        source: "calculated",
      });
    }
  }

  return { totalCredits, breakdown };
}

/**
 * Award credits to a user after successful order
 */
export async function awardCreditsToUser(userId: string, credits: number): Promise<void> {
  if (credits <= 0) return;

  await prisma.user.update({
    where: { id: userId },
    data: {
      giveawayCredits: {
        increment: credits,
      },
    },
  });
}

/**
 * Use credits for giveaway entries
 * Returns true if successful, false if not enough credits
 */
export async function useCreditsForEntry(
  userId: string,
  creditsToUse: number
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { giveawayCredits: true },
  });

  if (!user || user.giveawayCredits < creditsToUse) {
    return false;
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      giveawayCredits: {
        decrement: creditsToUse,
      },
    },
  });

  return true;
}

/**
 * Get user's current credit balance
 */
export async function getUserCredits(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { giveawayCredits: true },
  });

  return user?.giveawayCredits ?? 0;
}

