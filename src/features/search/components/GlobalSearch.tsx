import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SearchIcon, XCircleIcon } from "lucide-react";

import { globalSearch } from "@/features/search/api/globalSearch";
import type { GlobalSearchResult } from "@/types/api";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/utils/cn";

import { useDebounce } from "@/hooks/useDebounce";

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h3 className="text-lg font-semibold">{label}</h3>
      <Badge variant="secondary">{count}</Badge>
    </div>
  );
}

const statusVariant = (status: string) => {
  switch (status.toLowerCase()) {
    case "verified":
    case "paid":
    case "completed":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
    case "overdue":
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
};

export default function GlobalSearch() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);

  const {
    data: results,
    isLoading,
    isFetching,
  } = useQuery<GlobalSearchResult>({
    queryKey: ["globalSearch", debouncedQuery],
    queryFn: () => globalSearch(debouncedQuery),
    enabled: debouncedQuery.length >= 2,
    placeholderData: (prev) => prev,
  });

  const showResults = results && debouncedQuery.length >= 2;
  const showSpinner = (isLoading || isFetching) && debouncedQuery.length >= 2;
  const noResults =
    results &&
    results.transactions.length === 0 &&
    results.invoices.length === 0 &&
    results.businesses.length === 0;

  return (
    <div className="space-y-6">
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search transactions, invoices, businesses…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={cn("pl-10 pr-10")}
        />
        {query.length > 0 && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <XCircleIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      {showSpinner && (
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      )}

      {!showSpinner && query.length === 1 && (
        <p className="text-center text-muted-foreground py-6">
          Type at least 2 characters to search.
        </p>
      )}

      {!showSpinner && noResults && (
        <p className="text-center text-muted-foreground py-6">
          No results found for &ldquo;{debouncedQuery}&rdquo;.
        </p>
      )}

      {showResults && !showSpinner && !noResults && (
        <div className="space-y-8">
          {/* ── Transactions ── */}
          <section>
            <SectionLabel
              label="Transactions"
              count={results.transactions.length}
            />
            {results.transactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matching transactions.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="font-mono text-xs">
                        {txn.id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{txn.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {txn.amount}
                      </TableCell>
                      <TableCell>{txn.contactName}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(txn.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          {/* ── Invoices ── */}
          <section>
            <SectionLabel label="Invoices" count={results.invoices.length} />
            {results.invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matching invoices.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Number</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.invoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">
                        {inv.invoiceNumber}
                      </TableCell>
                      <TableCell>{inv.customerName}</TableCell>
                      <TableCell className="font-medium">
                        {inv.totalAmount}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(inv.status)}>
                          {inv.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>

          {/* ── Businesses ── */}
          <section>
            <SectionLabel
              label="Businesses"
              count={results.businesses.length}
            />
            {results.businesses.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No matching businesses.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.businesses.map((biz) => (
                    <TableRow key={biz.id}>
                      <TableCell className="font-medium">{biz.name}</TableCell>
                      <TableCell>{biz.ownerPhone}</TableCell>
                      <TableCell>{biz.email}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant(biz.verificationStatus)}>
                          {biz.verificationStatus}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
