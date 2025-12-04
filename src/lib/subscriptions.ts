// Subscription tier configuration
export const SUBSCRIPTION_TIERS = {
  BASIC: {
    id: "BASIC",
    name: "Basic",
    price: 20,
    discount: 5, // 5% off orders
    monthlyCredits: 100,
    freeShippingType: "wins", // Only on giveaway wins
    features: [
      "5% off all orders",
      "Free shipping on giveaway wins (1x/month)",
      "100 credits per month",
      "Priority support",
    ],
  },
  PLUS: {
    id: "PLUS",
    name: "Plus",
    price: 35,
    discount: 5, // 5% off orders
    monthlyCredits: 200,
    freeShippingType: "all", // On all orders
    features: [
      "5% off all orders",
      "Free shipping on any order (1x/month)",
      "200 credits per month",
      "Priority support",
      "Early access to giveaways",
    ],
  },
  PREMIUM: {
    id: "PREMIUM",
    name: "Premium",
    price: 50,
    discount: 7, // 7% off orders
    monthlyCredits: 340,
    freeShippingType: "all", // On all orders
    features: [
      "7% off all orders",
      "Free shipping on any order (1x/month)",
      "340 credits per month",
      "Priority support",
      "Early access to giveaways",
      "Exclusive member-only deals",
    ],
  },
} as const;

export type SubscriptionTierKey = keyof typeof SUBSCRIPTION_TIERS;

// Get discount percentage for a tier
export function getDiscountForTier(tier: SubscriptionTierKey | null): number {
  if (!tier) return 0;
  return SUBSCRIPTION_TIERS[tier]?.discount || 0;
}

// Get monthly credits for a tier
export function getCreditsForTier(tier: SubscriptionTierKey | null): number {
  if (!tier) return 0;
  return SUBSCRIPTION_TIERS[tier]?.monthlyCredits || 0;
}

// Check if tier allows free shipping on all orders (vs just wins)
export function canUseFreeShippingOnAll(tier: SubscriptionTierKey | null): boolean {
  if (!tier) return false;
  return SUBSCRIPTION_TIERS[tier]?.freeShippingType === "all";
}

// Check if free shipping can be used this period
export function canUseFreeShipping(
  tier: SubscriptionTierKey | null,
  lastUsed: Date | null,
  periodStart: Date | null
): boolean {
  if (!tier || !periodStart) return false;
  
  // If never used, can use
  if (!lastUsed) return true;
  
  // If used before current period started, can use again
  return lastUsed < periodStart;
}

