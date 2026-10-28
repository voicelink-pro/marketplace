import { Bell } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getViewer } from "@/modules/accounts/viewer";
import { settled } from "@/modules/attribution/components/result-metrics";
import { getOperationsInbox } from "@/modules/operations/queries";

/** `unread` is unknown while loading or when the inbox fails: no dot then. */
export function NotificationsBell({ unread = 0 }: { unread?: number }) {
  return (
    <Button variant="ghost" size="icon-lg" asChild className="relative rounded-full">
      <Link href="/notifications" aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}>
        <Bell aria-hidden />
        {unread > 0 ? (
          <span
            aria-hidden
            className="absolute top-2 right-2 size-2.5 rounded-full border-2 border-background bg-primary"
          />
        ) : null}
      </Link>
    </Button>
  );
}

/**
 * The dot comes from the inbox the notifications page already loads. Signed-out
 * visitors are left to the area's gate: the inbox query would redirect them itself.
 */
export async function ActiveNotificationsBell() {
  if (!(await getViewer())) return <NotificationsBell />;
  const inbox = await settled(() => getOperationsInbox());
  return <NotificationsBell unread={inbox?.unread} />;
}
