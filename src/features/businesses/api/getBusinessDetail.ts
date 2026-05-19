import apiClient from "@/lib/apiClient";
import type { BusinessDetail } from "@/types/api";

export async function getBusinessDetail(id: string): Promise<BusinessDetail> {
  const { data } = await apiClient.get<BusinessDetail>(
    `/admin/businesses/${id}`,
  );
  return data;
}
