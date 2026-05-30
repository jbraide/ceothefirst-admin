import apiClient from "@/lib/apiClient";
import type { OwnerListItem, PaginatedResponse } from "@/types/api";

export interface GetOwnersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const ownerKeys = {
  all: ["owners"] as const,
  lists: () => [...ownerKeys.all, "list"] as const,
  list: (params: GetOwnersParams) => [...ownerKeys.lists(), params] as const,
};

export async function getOwners(
  params: GetOwnersParams = {},
): Promise<PaginatedResponse<OwnerListItem>> {
  const { data } = await apiClient.get<PaginatedResponse<OwnerListItem>>(
    "/admin/owners",
    { params },
  );
  return data;
}
