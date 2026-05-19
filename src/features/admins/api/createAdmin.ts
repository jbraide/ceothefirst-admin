import apiClient from "@/lib/apiClient";
import type { AdminAccount, CreateAdminRequest } from "@/types/api";

export async function createAdmin(
  body: CreateAdminRequest,
): Promise<AdminAccount> {
  const { data } = await apiClient.post<AdminAccount>(
    "/admin/admins",
    body,
  );
  return data;
}
