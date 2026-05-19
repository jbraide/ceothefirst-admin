import apiClient from "@/lib/apiClient";
import type { BusinessDetail, UpdateBusinessStatusRequest } from "@/types/api";

export async function updateBusinessStatus(
  id: string,
  body: UpdateBusinessStatusRequest,
): Promise<BusinessDetail> {
  const { data } = await apiClient.patch<BusinessDetail>(
    `/admin/businesses/${id}/status`,
    body,
  );
  return data;
}
