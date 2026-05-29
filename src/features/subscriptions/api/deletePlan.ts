import apiClient from "@/lib/apiClient";

export async function deletePlan(id: string): Promise<void> {
  await apiClient.delete(`/admin/plans/${id}`);
}
