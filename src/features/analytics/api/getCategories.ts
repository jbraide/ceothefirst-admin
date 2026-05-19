import apiClient from "@/lib/apiClient";
import type { IndustryCategory } from "@/types/api";

export async function getCategories(): Promise<IndustryCategory[]> {
  const { data } = await apiClient.get<IndustryCategory[]>(
    "/admin/analytics/categories",
  );
  return data;
}
