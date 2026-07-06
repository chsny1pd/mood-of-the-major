import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeSeriesPoint } from "../../../types/statistics";

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
}

export function TimeSeriesChart({ data }: TimeSeriesChartProps) {
  const chartData = data
    .filter((point) => point.meetsThreshold)
    .map((point) => ({
      date: point.date.slice(5),
      moods: point.moodCount ?? 0,
      comments: point.commentCount ?? 0,
      reactions: point.reactionCount ?? 0,
    }));

  if (chartData.length === 0) {
    return <p className="text-sm text-stone-500">No time-series data for this period.</p>;
  }

  return (
    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="moods" stroke="#0f766e" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="comments" stroke="#0369a1" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="reactions" stroke="#b45309" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
