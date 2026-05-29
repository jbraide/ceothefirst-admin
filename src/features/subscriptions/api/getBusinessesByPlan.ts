import apiClient from "@/lib/apiClient";
import type { BusinessListItem } from "@/types/api";

export async function getBusinessesByPlan(
  planName: string,
): Promise<BusinessListItem[]> {
  const { data } = await apiClient.get<BusinessListItem[]>(
    `/admin/businesses/by-plan/${planName}`,
  );
  return data;
}
