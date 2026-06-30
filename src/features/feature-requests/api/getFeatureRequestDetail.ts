import apiClient from "@/lib/apiClient";
import type { FeatureRequestDetail } from "@/types/api";

export async function getFeatureRequestDetail(
  id: string,
): Promise<FeatureRequestDetail> {
  const { data } = await apiClient.get<FeatureRequestDetail>(
    `/admin/feature-requests/${id}`,
  );
  return data;
}
