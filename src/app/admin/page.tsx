import { ClipboardCheck } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";
import { Badge } from "@/components/ui/badge";
import { AdminReviewCard } from "@/modules/company-app/components/admin-review-card";
import { listAppsForAdminReview } from "@/modules/company-app/queries";

export const metadata: Metadata = { title: "Applications review" };

export default async function AdminReviewPage() {
  const apps = await listAppsForAdminReview();
  const submitted = apps.filter((app) => app.status === "submitted");
  const others = apps.filter((app) => app.status !== "submitted");

  return (
    <>
      <PageHeader
        title="Applications review"
        description="Inspect submitted app listings, verify their checklist, and approve them for the demo catalog or send them back with a reason."
      />

      <div className="flex flex-col gap-8">
        <section aria-labelledby="pending-review-heading" className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <h2 id="pending-review-heading" className="text-lg font-semibold">
              Submitted & waiting for review
            </h2>
            <Badge variant={submitted.length > 0 ? "default" : "secondary"} className="tabular">
              {submitted.length}
            </Badge>
          </div>

          {submitted.length === 0 ? (
            <EmptyModule
              icon={ClipboardCheck}
              title="No applications waiting for review"
              description="Submitted listings appear here with their checklist. You can approve them or send them back with a reason."
            />
          ) : (
            <div className="flex flex-col gap-5">
              {submitted.map((app) => (
                <AdminReviewCard key={app.id} app={app} />
              ))}
            </div>
          )}
        </section>

        {others.length > 0 ? (
          <section aria-labelledby="all-listings-heading" className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <h2 id="all-listings-heading" className="text-lg font-semibold">
                Published, rejected & draft listings
              </h2>
              <Badge variant="secondary" className="tabular">
                {others.length}
              </Badge>
            </div>

            <div className="flex flex-col gap-5">
              {others.map((app) => (
                <AdminReviewCard key={app.id} app={app} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
