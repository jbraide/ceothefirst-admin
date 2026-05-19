import apiClient from "@/lib/apiClient";
import type { AdminAccount } from "@/types/api";

export async function deactivateAdmin(id: string): Promise<AdminAccount> {
  const { data } = await apiClient.patch<AdminAccount>(
    `/admin/admins/${id}/deactivate`,
  );
  return data;
}
