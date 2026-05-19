import apiClient from "@/lib/apiClient";
import type { TransactionsVolumePoint, AnalyticsParams } from "@/types/api";

export async function getTransactionsVolume(
  params?: AnalyticsParams,
): Promise<TransactionsVolumePoint[]> {
  const { data } = await apiClient.get<TransactionsVolumePoint[]>(
    "/admin/analytics/transactions-volume",
    { params: { range: params?.range, category: params?.category } },
  );
  return data;
}
