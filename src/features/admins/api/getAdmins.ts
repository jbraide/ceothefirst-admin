import apiClient from "@/lib/apiClient";
import type { AdminAccount, PaginatedResponse } from "@/types/api";

export interface GetAdminsParams {
  page?: number;
  limit?: number;
}

export const adminKeys = {
  all: ["admins"] as const,
  lists: () => [...adminKeys.all, "list"] as const,
  list: (params: GetAdminsParams) => [...adminKeys.lists(), params] as const,
  details: () => [...adminKeys.all, "detail"] as const,
  detail: (id: string) => [...adminKeys.details(), id] as const,
};

export async function getAdmins(
  params: GetAdminsParams = {},
): Promise<PaginatedResponse<AdminAccount>> {
  const { data } = await apiClient.get<PaginatedResponse<AdminAccount>>(
    "/admin/admins",
    { params },
  );
  return data;
}
