import { useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Search, Phone, Calendar } from "lucide-react";

import { getOwners, type GetOwnersParams } from "../api/getOwners";
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
import type { OwnerListItem, OwnerBusiness } from "@/types/api";

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function OwnerBusinessRow({
  business,
  onClick,
}: {
  business: OwnerBusiness;
  onClick: () => void;
}) {
  return (
    <TableRow
      className="cursor-pointer bg-muted/30 hover:bg-muted/60"
      onClick={onClick}
      tabIndex={0}
      role="link"
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <TableCell />
      <TableCell className="pl-10 font-medium">{business.name}</TableCell>
      <TableCell>{business.businessType ?? "—"}</TableCell>
      <TableCell>
        {business.plan ? (
          <Badge variant="outline">{business.plan.label}</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell>
        <Badge variant={business.isActive ? "success" : "destructive"}>
          {business.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

function ExpandIcon({ expanded }: { expanded: boolean }) {
  return expanded ? (
    <ChevronDown className="h-4 w-4" />
  ) : (
    <ChevronRight className="h-4 w-4" />
  );
}

export default function OwnersList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [expandedOwners, setExpandedOwners] = useState<Set<string>>(new Set());
  const debouncedSearch = useDebounce(search, 400);

  const queryParams: GetOwnersParams = {
    page,
    limit: 15,
    ...(debouncedSearch.trim() ? { search: debouncedSearch.trim() } : {}),
  };

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["owners", queryParams],
    queryFn: () => getOwners(queryParams),
    placeholderData: (prev) => prev,
    staleTime: 30_000,
  });

  const owners = data?.results ?? [];
  const meta = data?.meta;

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
    setExpandedOwners(new Set());
  };

  function toggleExpand(ownerId: string) {
    setExpandedOwners((prev) => {
      const next = new Set(prev);
      if (next.has(ownerId)) {
        next.delete(ownerId);
      } else {
        next.add(ownerId);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* ─── Search ─── */}
      <div className="flex items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search owners..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            All Owners
            {meta && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                ({meta.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* ─── Loading ─── */}
          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Spinner className="h-8 w-8" />
            </div>
          )}

          {/* ─── Error ─── */}
          {isError && !isLoading && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-medium text-destructive">
                Failed to load owners
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please check your connection and try again.
              </p>
            </div>
          )}

          {/* ─── Empty ─── */}
          {!isLoading && !isError && owners.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-lg font-medium text-muted-foreground">
                No owners found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {debouncedSearch
                  ? `No results for "${debouncedSearch}". Try a different search term.`
                  : "There are no registered business owners yet."}
              </p>
            </div>
          )}

          {/* ─── Table ─── */}
          {!isLoading && !isError && owners.length > 0 && (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10" />
                      <TableHead>Name</TableHead>
                      <TableHead>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          Phone
                        </span>
                      </TableHead>
                      <TableHead>Business Count</TableHead>
                      <TableHead className="text-right">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          Created
                        </span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {owners.map((owner: OwnerListItem) => {
                      const isExpanded = expandedOwners.has(owner.id);
                      return (
                        <Fragment key={owner.id}>
                          {/* Owner row */}
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleExpand(owner.id)}
                            tabIndex={0}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                toggleExpand(owner.id);
                              }
                            }}
                          >
                            <TableCell>
                              <ExpandIcon expanded={isExpanded} />
                            </TableCell>
                            <TableCell className="font-medium">
                              {owner.name || "—"}
                            </TableCell>
                            <TableCell>{owner.phone}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {owner.businessCount}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right text-muted-foreground">
                              {formatDate(owner.createdAt)}
                            </TableCell>
                          </TableRow>

                          {/* Expanded businesses */}
                          {isExpanded &&
                            owner.businesses.map((biz: OwnerBusiness) => (
                              <OwnerBusinessRow
                                key={biz.id}
                                business={biz}
                                onClick={() =>
                                  navigate(`/businesses/${biz.id}`)
                                }
                              />
                            ))}
                        </Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* ─── Pagination ─── */}
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
