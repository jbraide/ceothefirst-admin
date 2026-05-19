import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/Button";

export interface PaginationProps {
  /** The currently active page (1-based) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Called when the user navigates to a different page */
  onPageChange: (page: number) => void;
  /** Additional class names on the wrapper */
  className?: string;
}

/**
 * Generates an array of page numbers and ellipsis markers
 * for a pagination component.
 *
 * e.g. [1, '...', 4, 5, 6, '...', 10]
 */
function generatePages(
  current: number,
  total: number,
  siblingCount = 1,
): (number | "ellipsis-start" | "ellipsis-end")[] {
  const totalNumbers = siblingCount * 2 + 3; // siblings + current + first + last
  const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];

  if (total <= totalNumbers + 2) {
    for (let i = 1; i <= total; i++) pages.push(i);
    return pages;
  }

  const leftSibling = Math.max(current - siblingCount, 2);
  const rightSibling = Math.min(current + siblingCount, total - 1);
  const showLeftEllipsis = leftSibling > 2;
  const showRightEllipsis = rightSibling < total - 1;

  pages.push(1);

  if (showLeftEllipsis) {
    pages.push("ellipsis-start");
  }

  for (let i = leftSibling; i <= rightSibling; i++) {
    pages.push(i);
  }

  if (showRightEllipsis) {
    pages.push("ellipsis-end");
  }

  pages.push(total);
  return pages;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = useMemo(
    () => generatePages(currentPage, totalPages),
    [currentPage, totalPages],
  );

  if (totalPages <= 1) return null;

  return (
    <nav
      role="navigation"
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-1", className)}
    >
      {/* Previous */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        aria-label="Go to previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {/* Page numbers */}
      {pages.map((page, idx) => {
        if (page === "ellipsis-start" || page === "ellipsis-end") {
          return (
            <span
              key={page}
              className="flex h-10 w-10 items-center justify-center text-sm text-primary/50"
              aria-hidden="true"
            >
              …
            </span>
          );
        }

        const isActive = page === currentPage;

        return (
          <Button
            key={`${page}-${idx}`}
            variant={isActive ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(page as number)}
            aria-label={`Go to page ${page}`}
            aria-current={isActive ? "page" : undefined}
          >
            {page}
          </Button>
        );
      })}

      {/* Next */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        aria-label="Go to next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  );
}
