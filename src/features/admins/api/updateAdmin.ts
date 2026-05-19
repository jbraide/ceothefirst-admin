import apiClient from "@/lib/apiClient";
import type { AdminAccount, UpdateAdminRequest } from "@/types/api";

export async function updateAdmin(
  id: string,
  body: UpdateAdminRequest,
): Promise<AdminAccount> {
  const { data } = await apiClient.patch<AdminAccount>(
    `/admin/admins/${id}`,
    body,
  );
  return data;
}
