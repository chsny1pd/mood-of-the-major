import { describe, expect, it } from "vitest";
import { aggregateMoodsByWeekday } from "./aggregateByWeekday";
import type { TimeSeriesPoint } from "../../types/statistics";

function point(date: string, moodCount: number): TimeSeriesPoint {
  return {
    date,
    moodCount,
    commentCount: 0,
    reactionCount: 0,
    meetsThreshold: true,
  };
}

describe("aggregateMoodsByWeekday", () => {
  it("buckets mood counts by UTC weekday", () => {
    // 2026-07-13 is Monday, 2026-07-14 is Tuesday
    const result = aggregateMoodsByWeekday([
      point("2026-07-13", 3),
      point("2026-07-14", 5),
      point("2026-07-13", 2),
    ]);
    expect(result[1]).toBe(5); // Monday
    expect(result[2]).toBe(5); // Tuesday
  });
});
