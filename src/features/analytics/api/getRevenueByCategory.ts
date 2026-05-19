import apiClient from "@/lib/apiClient";
import type { RevenueByCategoryItem, AnalyticsParams } from "@/types/api";

export async function getRevenueByCategory(
  params?: AnalyticsParams,
): Promise<RevenueByCategoryItem[]> {
  const { data } = await apiClient.get<RevenueByCategoryItem[]>(
    "/admin/analytics/revenue-by-category",
    { params: { range: params?.range, category: params?.category } },
  );
  return data;
}
