import type { TimeSeriesPoint } from "../../types/statistics";

/** Returns mood counts indexed by UTC weekday: 0=Sun … 6=Sat */
export function aggregateMoodsByWeekday(points: TimeSeriesPoint[]): number[] {
  const buckets = [0, 0, 0, 0, 0, 0, 0];
  for (const point of points) {
    if (!point.meetsThreshold || point.moodCount == null) continue;
    const day = new Date(`${point.date}T12:00:00.000Z`).getUTCDay();
    buckets[day] += point.moodCount;
  }
  return buckets;
}
