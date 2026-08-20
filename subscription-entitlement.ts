export interface SubscriptionEntitlement {
  tier: "free" | "pro" | "studio" | "kitchen";
  status: string;
  currentPeriodEnd: Date | null;
}

/**
 * A paid tier is not enough on its own: canceled, inactive, past-due or expired
 * subscriptions must fall back to Free-plan limits.
 */
export function hasActivePaidEntitlement(
  subscription: SubscriptionEntitlement | undefined,
  now = new Date()
): boolean {
  if (!subscription || subscription.tier === "free") return false;
  if (!new Set(["active", "trialing"]).has(subscription.status)) return false;
  return !subscription.currentPeriodEnd || subscription.currentPeriodEnd.getTime() > now.getTime();
}
