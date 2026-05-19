import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil } from "lucide-react";

import { getAdmins, adminKeys, type GetAdminsParams } from "../api/getAdmins";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Pagination } from "@/components/ui/Pagination";
import { Spinner } from "@/components/ui/Spinner";
import type { AdminAccount, AdminRole } from "@/types/api";

const ROLE_VARIANT: Record<AdminRole, string> = {
  SUPER_ADMIN: "bg-indigo-100 text-indigo-800 border-indigo-200",
  SUPPORT_ADMIN: "bg-blue-100 text-blue-800 border-blue-200",
  ANALYST: "bg-gray-100 text-gray-800 border-gray-200",
};

const ROLE_LABEL: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  SUPPORT_ADMIN: "Support Admin",
  ANALYST: "Analyst",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export interface AdminListProps {
  onEdit: (admin: AdminAccount) => void;
}

export default function AdminList({ onEdit }: AdminListProps) {
  const [page, setPage] = useState(1);

  const queryParams: GetAdminsParams = {
    page,
    limit: 15,
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: adminKeys.list(queryParams),
    queryFn: () => getAdmins(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const admins = data?.results ?? [];
  const meta = data?.meta;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Admin Accounts
          {meta && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({meta.total} total)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Spinner className="h-8 w-8" />
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-destructive font-medium">
              Failed to load admin accounts
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Please check your connection and try again.
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && admins.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No admin accounts found
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              There are no admin accounts registered yet.
            </p>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && admins.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {admins.map((admin: AdminAccount) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">
                        {admin.name}
                      </TableCell>
                      <TableCell>{admin.email}</TableCell>
                      <TableCell>
                        <Badge
                          className={ROLE_VARIANT[admin.role]}
                          variant="outline"
                        >
                          {ROLE_LABEL[admin.role]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            admin.isActive !== false ? "success" : "destructive"
                          }
                        >
                          {admin.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDate(admin.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(admin)}
                          aria-label={`Edit ${admin.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {meta && meta.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-between border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  Page {meta.page} of {meta.totalPages}
                </p>
                <Pagination
                  currentPage={meta.page}
                  totalPages={meta.totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
