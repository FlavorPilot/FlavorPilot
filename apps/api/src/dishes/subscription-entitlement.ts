/** Current plan state is trusted only when loaded on the server, never from a browser payload. */
export function hasActivePaidEntitlement(subscription: {
    tier: string;
    status: string;
    currentPeriodEnd: Date | null;
} | null | undefined, now = new Date()): boolean {
    return Boolean(subscription && subscription.tier !== 'free' && ['active', 'trialing'].includes(subscription.status) && (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > now));
}
