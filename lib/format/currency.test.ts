import { describe, expect, it } from "vitest";
import { formatFrom, formatMoney } from "./currency";

describe("formatMoney — NGN / en-NG (the D1/D3 fix)", () => {
  it("renders whole amounts with the ₦ sign and no decimals", () => {
    expect(formatMoney(6000)).toBe("₦6,000");
    expect(formatMoney(19500)).toBe("₦19,500");
  });

  it("groups thousands", () => {
    expect(formatMoney(1234567)).toBe("₦1,234,567");
  });

  it("shows two decimals only for fractional amounts", () => {
    expect(formatMoney(6.5)).toBe("₦6.50");
  });

  it("handles zero", () => {
    expect(formatMoney(0)).toBe("₦0");
  });

  it("NEVER emits a $ for NGN — this is the bug being replaced", () => {
    expect(formatMoney(6000)).not.toContain("$");
  });

  it("honours a different currency/locale setting (currency is not hardcoded)", () => {
    expect(formatMoney(1000, { currency: "USD", locale: "en-US" })).toBe("$1,000");
  });
});

describe("formatFrom", () => {
  it("prefixes 'from' for variant/'from' pricing", () => {
    expect(formatFrom(6000)).toBe("from ₦6,000");
    expect(formatFrom(8000)).toBe("from ₦8,000");
  });
});
