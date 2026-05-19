import apiClient from "@/lib/apiClient";
import type { AdminAccount } from "@/types/api";

export async function getAdminDetail(id: string): Promise<AdminAccount> {
  const { data } = await apiClient.get<AdminAccount>(
    `/admin/admins/${id}`,
  );
  return data;
}
