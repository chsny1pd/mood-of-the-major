import { describe, expect, it } from "vitest";
import { ageFromBirthYear } from "../../src/utils/ageFromBirthYear.js";

describe("ageFromBirthYear", () => {
  it("computes age from birth year", () => {
    expect(ageFromBirthYear(2004, new Date("2026-07-18T00:00:00Z"))).toBe(22);
  });
});
