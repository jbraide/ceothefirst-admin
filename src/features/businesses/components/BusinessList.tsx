import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import {
  getBusinesses,
  businessKeys,
  type GetBusinessesParams,
} from "../api/getBusinesses";
import { useDebounce } from "@/hooks/useDebounce";
import { Input } from "@/components/ui/Input";
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
import type { BusinessListItem } from "@/types/api";

const KYC_VARIANT: Record<string, "success" | "warning" | "destructive"> = {
  VERIFIED: "success",
  PENDING: "warning",
  REJECTED: "destructive",
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function BusinessList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const queryParams: GetBusinessesParams = {
    page,
    limit: 15,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: businessKeys.list(queryParams),
    queryFn: () => getBusinesses(queryParams),
    placeholderData: (prev) => prev,
  });

  // Reset to page 1 when search changes
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const businesses = data?.results ?? [];
  const meta = data?.meta;

  return (
    <div className="space-y-6">
      {/* ─── Header & Search ─── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Businesses</h2>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search businesses..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* ─── Content Card ─── */}
      <Card>
        <CardHeader>
          <CardTitle>
            All Businesses
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
                Failed to load businesses
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please check your connection and try again.
              </p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && businesses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No businesses found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {debouncedSearch
                  ? `No results for "${debouncedSearch}". Try a different search term.`
                  : "There are no registered businesses yet."}
              </p>
            </div>
          )}

          {/* Table */}
          {!isLoading && !isError && businesses.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>KYC</TableHead>
                      <TableHead className="text-right">Transactions</TableHead>
                      <TableHead className="text-right">Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {businesses.map((biz: BusinessListItem) => (
                      <TableRow
                        key={biz.id}
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        tabIndex={0}
                        role="link"
                        onClick={() => navigate(`/businesses/${biz.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            navigate(`/businesses/${biz.id}`);
                          }
                        }}
                      >
                        <TableCell className="font-medium">
                          {biz.name}
                        </TableCell>
                        <TableCell>{biz.ownerPhone}</TableCell>
                        <TableCell>{biz.category ?? "—"}</TableCell>
                        <TableCell>{biz.state ?? "—"}</TableCell>
                        <TableCell>
                          <Badge
                            variant={biz.isActive ? "success" : "destructive"}
                          >
                            {biz.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={KYC_VARIANT[biz.verificationStatus]}>
                            {biz.verificationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {biz._count.transactions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {formatDate(biz.createdAt)}
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
    </div>
  );
}
