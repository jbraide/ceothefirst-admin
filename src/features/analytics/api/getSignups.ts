import apiClient from "@/lib/apiClient";
import type { TimeSeriesPoint, AnalyticsParams } from "@/types/api";

export async function getSignups(
  params?: AnalyticsParams,
): Promise<TimeSeriesPoint[]> {
  const { data } = await apiClient.get<TimeSeriesPoint[]>(
    "/admin/analytics/signups",
    { params: { range: params?.range, category: params?.category } },
  );
  return data;
}
