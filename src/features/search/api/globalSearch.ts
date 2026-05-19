import apiClient from "@/lib/apiClient";
import type { GlobalSearchResult } from "@/types/api";

export async function globalSearch(query: string): Promise<GlobalSearchResult> {
  const response = await apiClient.get<GlobalSearchResult>(
    `/admin/search/global?q=${encodeURIComponent(query)}`,
  );
  return response.data;
}
