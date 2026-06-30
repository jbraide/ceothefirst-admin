import apiClient from "@/lib/apiClient";
import type { FeatureRequestDetail, UpdateFeatureRequestStatus } from "@/types/api";

export async function updateFeatureRequestStatus(
  id: string,
  body: UpdateFeatureRequestStatus,
): Promise<FeatureRequestDetail> {
  const { data } = await apiClient.patch<FeatureRequestDetail>(
    `/admin/feature-requests/${id}`,
    body,
  );
  return data;
}
