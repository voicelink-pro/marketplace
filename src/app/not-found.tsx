import { SearchX } from "lucide-react";
import Link from "next/link";
import { EmptyModule } from "@/components/states/empty-module";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-lg items-center px-4">
      <EmptyModule
        icon={SearchX}
        title="Page not found"
        description="The page doesn't exist or you don't have access to it."
      >
        <Button asChild>
          <Link href="/">Go to the marketplace</Link>
        </Button>
      </EmptyModule>
    </main>
  );
}
