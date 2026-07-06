import { describe, expect, it } from "vitest";
import { AggregationThresholdPolicy } from "../../src/domain/services/AggregationThresholdPolicy.js";

describe("AggregationThresholdPolicy", () => {
  const policy = new AggregationThresholdPolicy(5);

  it("returns false when count is below minimum", () => {
    expect(policy.meetsThreshold(4)).toBe(false);
    expect(policy.meetsThreshold(0)).toBe(false);
  });

  it("returns true when count meets minimum", () => {
    expect(policy.meetsThreshold(5)).toBe(true);
    expect(policy.meetsThreshold(100)).toBe(true);
  });

  it("exposes configured minimum", () => {
    expect(policy.minimumThreshold).toBe(5);
  });
});
