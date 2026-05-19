import apiClient from "@/lib/apiClient";
import type { AuditLogEntry, PaginatedResponse } from "@/types/api";

export interface GetAuditLogsParams {
  page?: number;
  limit?: number;
}

export async function getAuditLogs({
  page = 1,
  limit = 15,
}: GetAuditLogsParams = {}): Promise<PaginatedResponse<AuditLogEntry>> {
  const { data } = await apiClient.get<PaginatedResponse<AuditLogEntry>>(
    "/admin/audit-logs",
    { params: { page, limit } },
  );
  return data;
}
