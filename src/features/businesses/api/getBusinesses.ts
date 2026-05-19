import apiClient from '@/lib/apiClient'
import type { BusinessListItem, PaginatedResponse } from '@/types/api'

export interface GetBusinessesParams {
  page?: number
  limit?: number
  search?: string
}

export const businessKeys = {
  all: ['businesses'] as const,
  lists: () => [...businessKeys.all, 'list'] as const,
  list: (params: GetBusinessesParams) => [...businessKeys.lists(), params] as const,
  details: () => [...businessKeys.all, 'detail'] as const,
  detail: (id: string) => [...businessKeys.details(), id] as const,
}

export async function getBusinesses(
  params: GetBusinessesParams = {},
): Promise<PaginatedResponse<BusinessListItem>> {
  const { data } = await apiClient.get<PaginatedResponse<BusinessListItem>>(
    '/admin/businesses',
    { params },
  )
  return data
}
