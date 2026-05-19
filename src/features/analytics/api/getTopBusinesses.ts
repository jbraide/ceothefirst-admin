import apiClient from "@/lib/apiClient";
import type { TopBusiness, AnalyticsParams } from "@/types/api";

export async function getTopBusinesses(
  params?: AnalyticsParams & { limit?: number },
): Promise<TopBusiness[]> {
  const { data } = await apiClient.get<TopBusiness[]>(
    "/admin/analytics/top-businesses",
    {
      params: {
        range: params?.range,
        category: params?.category,
        limit: params?.limit,
      },
    },
  );
  return data;
}
