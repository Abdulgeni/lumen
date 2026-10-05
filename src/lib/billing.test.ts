import { describe, expect, it } from "vitest";
import { grantsAccess, paidPlanForLookupKey, pickSubscription } from "./billing";

const sub = (plan: string, status: string, day = 1) => ({
  plan,
  status,
  currentPeriodEnd: new Date(Date.UTC(2040, 0, day)),
});

describe("paidPlanForLookupKey", () => {
  it("maps known keys and rejects everything else", () => {
    expect(paidPlanForLookupKey("lumen_pro_monthly")).toBe("pro");
    expect(paidPlanForLookupKey("lumen_team_monthly")).toBe("team");
    expect(paidPlanForLookupKey("something_else")).toBeNull();
    expect(paidPlanForLookupKey(null)).toBeNull();
  });
});

describe("grantsAccess", () => {
  it.each(["active", "trialing", "past_due"])("grants access for %s", (status) => {
    expect(grantsAccess(status)).toBe(true);
  });
  it.each(["canceled", "unpaid", "incomplete", "incomplete_expired", "paused", "nonsense"])(
    "denies access for %s",
    (status) => {
      expect(grantsAccess(status)).toBe(false);
    },
  );
});

describe("pickSubscription", () => {
  it("returns null when nothing grants access", () => {
    expect(pickSubscription([sub("pro", "canceled"), sub("team", "unpaid")])).toBeNull();
    expect(pickSubscription([])).toBeNull();
  });
  it("prefers the higher tier, then the later period", () => {
    expect(pickSubscription([sub("pro", "active", 20), sub("team", "active", 5)])?.plan).toBe(
      "team",
    );
    expect(
      pickSubscription([
        sub("pro", "active", 5),
        sub("pro", "active", 20),
      ])?.currentPeriodEnd.getUTCDate(),
    ).toBe(20);
  });
  it("ignores lapsed or unknown subscriptions", () => {
    expect(pickSubscription([sub("team", "canceled"), sub("pro", "active")])?.plan).toBe("pro");
    expect(pickSubscription([sub("enterprise", "active")])).toBeNull();
  });
});
