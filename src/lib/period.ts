export type Period = { start: Date; end: Date };

export function calendarMonthPeriod(now: Date = new Date()): Period {
  return {
    start: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)),
    end: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)),
  };
}

/**
 * Paid users are metered on their Stripe billing period. Everyone else, and anyone whose
 * subscription period has lapsed, is metered on the UTC calendar month.
 */
export function resolvePeriod(
  subscription: { periodStart: Date; periodEnd: Date } | null,
  now: Date = new Date(),
): Period {
  if (subscription && subscription.periodStart <= now && now < subscription.periodEnd) {
    return { start: subscription.periodStart, end: subscription.periodEnd };
  }
  return calendarMonthPeriod(now);
}
