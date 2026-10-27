"use client";

import { TriangleAlert } from "lucide-react";
import Link from "next/link";
import { EmptyModule } from "@/components/states/empty-module";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  const digest =
    error instanceof Error && "digest" in error && typeof error.digest === "string"
      ? error.digest
      : undefined;
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg items-center px-4">
      <EmptyModule
        icon={TriangleAlert}
        title="Something went wrong"
        description={
          digest
            ? `We couldn't load this page. If it keeps happening, contact support with code ${digest}.`
            : "We couldn't load this page. Try again in a moment."
        }
      >
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={() => retry()}>Try again</Button>
          <Button variant="outline" asChild><Link href="/support">Contact support</Link></Button>
          <Button variant="outline" asChild>
            <Link href="/">Go to the marketplace</Link>
          </Button>
        </div>
      </EmptyModule>
    </main>
  );
}
