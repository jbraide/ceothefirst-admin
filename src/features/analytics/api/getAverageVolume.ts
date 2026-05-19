import apiClient from "@/lib/apiClient";
import type { AverageVolume, AnalyticsParams } from "@/types/api";

export async function getAverageVolume(
  params?: AnalyticsParams,
): Promise<AverageVolume> {
  const { data } = await apiClient.get<AverageVolume>(
    "/admin/analytics/average-volume",
    { params: { range: params?.range, category: params?.category } },
  );
  return data;
}
