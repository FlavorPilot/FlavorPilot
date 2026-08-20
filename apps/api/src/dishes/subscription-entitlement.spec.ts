import { describe, expect, it } from "vitest";
import { hasActivePaidEntitlement } from "./subscription-entitlement";

const now = new Date("2026-08-20T12:00:00.000Z");

describe("hasActivePaidEntitlement", () => {
  it("accepts active and trialing paid plans", () => {
    expect(
      hasActivePaidEntitlement(
        { tier: "pro", status: "active", currentPeriodEnd: new Date("2026-09-01T00:00:00Z") },
        now
      )
    ).toBe(true);
    expect(
      hasActivePaidEntitlement(
        { tier: "studio", status: "trialing", currentPeriodEnd: null },
        now
      )
    ).toBe(true);
  });

  it("rejects free, canceled and expired plans", () => {
    expect(
      hasActivePaidEntitlement({ tier: "free", status: "active", currentPeriodEnd: null }, now)
    ).toBe(false);
    expect(
      hasActivePaidEntitlement({ tier: "pro", status: "canceled", currentPeriodEnd: null }, now)
    ).toBe(false);
    expect(
      hasActivePaidEntitlement(
        { tier: "kitchen", status: "active", currentPeriodEnd: new Date("2026-08-19T00:00:00Z") },
        now
      )
    ).toBe(false);
  });
});
