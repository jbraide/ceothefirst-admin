import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { getAuditLogs } from "@/features/audit/api/getAuditLogs";
import type { AuditLogEntry } from "@/types/api";
import { Badge } from "@/components/ui/Badge";
import { Spinner } from "@/components/ui/Spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";

const PAGE_SIZE = 15;

const actionVariant = (action: string) => {
  const a = action.toLowerCase();
  if (a.includes("delete") || a.includes("remove")) return "destructive";
  if (a.includes("create") || a.includes("add")) return "success";
  if (a.includes("update") || a.includes("edit") || a.includes("modify"))
    return "warning";
  return "secondary";
};

export default function AuditLogList() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["auditLogs", page],
    queryFn: () => getAuditLogs({ page, limit: PAGE_SIZE }),
    placeholderData: (prev) => prev,
  });

  const totalPages = data?.meta.totalPages ?? 1;
  const entries = data?.results ?? [];

  return (
    <div className="space-y-4">
      {(isLoading || isFetching) && !data ? (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      ) : entries.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">
          No audit log entries found.
        </p>
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Action</TableHead>
                <TableHead>Target ID</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Admin Name</TableHead>
                <TableHead>Admin Email</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.map((entry: AuditLogEntry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge variant={actionVariant(entry.action)}>
                      {entry.action}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {entry.targetId ?? "—"}
                  </TableCell>
                  <TableCell
                    className="max-w-[240px] truncate"
                    title={entry.details ?? undefined}
                  >
                    {entry.details ?? "—"}
                  </TableCell>
                  <TableCell>{entry.admin.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {entry.admin.email}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {new Date(entry.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing page {page} of {totalPages} ({data?.meta.total ?? 0} total
              entries)
            </p>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </div>

          {isFetching && (
            <div className="flex justify-center">
              <Spinner />
            </div>
          )}
        </>
      )}
    </div>
  );
}
