import apiClient from "@/lib/apiClient";
import type { TimeSeriesPoint, AnalyticsParams } from "@/types/api";

export async function getRevenueGrowth(
  params?: AnalyticsParams,
): Promise<TimeSeriesPoint[]> {
  const { data } = await apiClient.get<TimeSeriesPoint[]>(
    "/admin/analytics/revenue-growth",
    { params: { range: params?.range, category: params?.category } },
  );
  return data;
}
