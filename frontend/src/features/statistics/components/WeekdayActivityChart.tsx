import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeSeriesPoint } from "../../../types/statistics";
import { aggregateMoodsByWeekday } from "../aggregateByWeekday";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

interface WeekdayActivityChartProps {
  data: TimeSeriesPoint[];
}

export function WeekdayActivityChart({ data }: WeekdayActivityChartProps) {
  const { t } = useTranslation();

  const chartData = useMemo(() => {
    const buckets = aggregateMoodsByWeekday(data);
    return DAY_KEYS.map((key, index) => ({
      day: t(`dashboard.weekday.${key}`),
      moods: buckets[index] ?? 0,
    }));
  }, [data, t]);

  const hasData = chartData.some((row) => row.moods > 0);
  if (!hasData) {
    return <p className="text-sm text-stone-500 dark:text-stone-400">{t("charts.noTimeSeriesData")}</p>;
  }

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="moods" fill="#ea580c" radius={[6, 6, 0, 0]} name={t("statistics.kpiMoods")} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
