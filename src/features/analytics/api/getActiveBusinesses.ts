import apiClient from "@/lib/apiClient";
import type { ActiveBusinesses, AnalyticsParams } from "@/types/api";

export async function getActiveBusinesses(
  params?: AnalyticsParams,
): Promise<ActiveBusinesses> {
  const { data } = await apiClient.get<ActiveBusinesses>(
    "/admin/analytics/active-businesses",
    { params: { range: params?.range, category: params?.category } },
  );
  return data;
}
