import { Users } from "lucide-react";
import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/states/empty-module";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listUsersForAdmin } from "@/modules/accounts/queries";

export const metadata: Metadata = { title: "Users" };

const USERS_LIMIT = 100;
const dateFormat = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });

export default async function AdminUsersPage() {
  const users = await listUsersForAdmin(USERS_LIMIT);

  return (
    <>
      <PageHeader title="Users" description="Accounts on the marketplace, newest first." />
      {users.length === 0 ? (
        <EmptyModule icon={Users} title="No users yet" description="New accounts appear here." />
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableCaption className="pb-4">
              {users.length === USERS_LIMIT
                ? `Showing the ${USERS_LIMIT} newest accounts.`
                : `${users.length} ${users.length === 1 ? "account" : "accounts"}.`}
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Uses as</TableHead>
                <TableHead className="text-right">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.displayName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {user.isCreator ? <Badge variant="secondary">Creator</Badge> : null}
                      {user.companyCount > 0 ? <Badge variant="secondary">Company</Badge> : null}
                      {!user.isCreator && user.companyCount === 0 ? (
                        <span className="text-muted-foreground">Not set up</span>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="tabular text-right text-muted-foreground">
                    {dateFormat.format(new Date(user.joinedAt))}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
