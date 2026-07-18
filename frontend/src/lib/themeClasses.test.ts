import { describe, expect, it } from "vitest";
import { themeClasses } from "./themeClasses";

describe("themeClasses brand tokens", () => {
  it("uses orange brand accents instead of teal", () => {
    expect(themeClasses.link).toContain("orange");
    expect(themeClasses.link).not.toContain("teal");
    expect(themeClasses.linkSubtle).toContain("orange");
    expect(themeClasses.input).toContain("orange");
    expect(themeClasses.select).toContain("orange");
  });
});
