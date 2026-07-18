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
import { useLocalizedName } from "../../../lib/useLocalizedName";
import { emotionEmoji } from "../../../lib/emotionEmoji";
import type { DistributionItem } from "../../../types/statistics";

interface DistributionChartProps {
  data: DistributionItem[];
}

export function DistributionChart({ data }: DistributionChartProps) {
  const { t } = useTranslation();
  const localizedName = useLocalizedName();

  const chartData = data
    .filter((item) => item.meetsThreshold && item.moodCount !== null)
    .map((item) => ({
      name: `${emotionEmoji(item.tag.iconKey, item.tag.slug)} ${localizedName(item.tag)}`,
      count: item.moodCount ?? 0,
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-stone-500">{t("charts.noDistributionData")}</p>;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={-20} textAnchor="end" height={60} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="count" fill="#0f766e" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
