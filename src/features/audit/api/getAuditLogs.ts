import apiClient from '@/lib/apiClient'
import type { AuditLogEntry, PaginatedResponse } from '@/types/api'

export interface GetAuditLogsParams {
  page: number
  limit: number
}

export async function getAuditLogs({
  page,
  limit,
}: GetAuditLogsParams): Promise<PaginatedResponse<AuditLogEntry>> {
  const response = await apiClient.get<PaginatedResponse<AuditLogEntry>>(
    `/admin/audit-logs?page=${page}&limit=${limit}`,
  )
  return response.data
}
