import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildCatalogHref, type CatalogFilters } from "../filters";

export function CatalogPagination({
  filters,
  totalCount,
  pageSize,
  totalPages,
}: {
  filters: CatalogFilters;
  totalCount: number;
  pageSize: number;
  totalPages: number;
}) {
  if (totalCount === 0 || totalPages <= 1) return null;

  const currentPage = Math.min(Math.max(filters.page, 1), totalPages);
  const rangeStart = (currentPage - 1) * pageSize + 1;
  const rangeEnd = Math.min(currentPage * pageSize, totalCount);
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Catalog pagination"
      className="flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row"
    >
      <p className="tabular text-sm text-muted-foreground">
        Showing {rangeStart}–{rangeEnd} of {totalCount} apps
      </p>

      <div className="flex flex-wrap items-center gap-1.5">
        {currentPage > 1 ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildCatalogHref(filters, { page: currentPage - 1 })}>
              <ChevronLeft data-icon="inline-start" />
              Previous
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            <ChevronLeft data-icon="inline-start" />
            Previous
          </Button>
        )}

        {pages.map((pageNumber) => {
          const isCurrent = pageNumber === currentPage;
          return (
            <Button
              key={pageNumber}
              variant={isCurrent ? "default" : "outline"}
              size="sm"
              className="tabular min-w-9"
              asChild={!isCurrent}
              aria-current={isCurrent ? "page" : undefined}
            >
              {isCurrent ? (
                <span>{pageNumber}</span>
              ) : (
                <Link href={buildCatalogHref(filters, { page: pageNumber })}>{pageNumber}</Link>
              )}
            </Button>
          );
        })}

        {currentPage < totalPages ? (
          <Button variant="outline" size="sm" asChild>
            <Link href={buildCatalogHref(filters, { page: currentPage + 1 })}>
              Next
              <ChevronRight data-icon="inline-end" />
            </Link>
          </Button>
        ) : (
          <Button variant="outline" size="sm" disabled>
            Next
            <ChevronRight data-icon="inline-end" />
          </Button>
        )}
      </div>
    </nav>
  );
}
