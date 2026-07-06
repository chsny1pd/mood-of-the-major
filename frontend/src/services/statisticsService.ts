import { apiClient } from "./apiClient";
import type { DashboardData, TrendingData } from "../types/statistics";

export interface DashboardParams {
  scope?: "platform" | "faculty" | "major";
  scopeId?: string;
  period?: "7d" | "30d" | "90d";
}

export async function fetchStatisticsDashboard(params: DashboardParams = {}): Promise<DashboardData> {
  const response = await apiClient.get<{ success: true; data: DashboardData }>(
    "/statistics/dashboard",
    { params },
  );
  return response.data.data;
}

export async function fetchTrendingEmotions(params: {
  scope?: "platform" | "faculty" | "major";
  scopeId?: string;
  window?: "7d" | "30d";
} = {}): Promise<TrendingData> {
  const response = await apiClient.get<{ success: true; data: TrendingData }>("/moods/trending", {
    params,
  });
  return response.data.data;
}
