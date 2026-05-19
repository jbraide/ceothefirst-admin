import apiClient from "@/lib/apiClient";
import type { ComparisonData, AnalyticsParams } from "@/types/api";

export async function getComparison(
  params?: AnalyticsParams,
): Promise<ComparisonData> {
  const { data } = await apiClient.get<ComparisonData>(
    "/admin/analytics/comparison",
    { params: { range: params?.range, category: params?.category } },
  );
  return data;
}
