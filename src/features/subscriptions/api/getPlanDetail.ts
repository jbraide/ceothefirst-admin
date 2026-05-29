import apiClient from "@/lib/apiClient";
import type { Plan } from "@/types/api";

export async function getPlanDetail(id: string): Promise<Plan> {
  const { data } = await apiClient.get<Plan>(`/admin/plans/${id}`);
  return data;
}
