import apiClient from "@/lib/apiClient";
import type { PlatformDebtItem } from "@/types/api";

export async function getPlatformDebt(params?: {
  category?: string;
}): Promise<PlatformDebtItem[]> {
  const { data } = await apiClient.get<PlatformDebtItem[]>(
    "/admin/analytics/platform-debt",
    { params: { category: params?.category } },
  );
  return data;
}
