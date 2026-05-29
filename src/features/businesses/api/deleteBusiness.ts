import apiClient from "@/lib/apiClient";
import type { DeleteBusinessResponse } from "@/types/api";

export async function deleteBusiness(id: string): Promise<DeleteBusinessResponse> {
  const { data } = await apiClient.delete<DeleteBusinessResponse>(
    `/admin/businesses/${id}`
  );
  return data;
}
