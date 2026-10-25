import { notFound, redirect } from "next/navigation";
import { requireViewer } from "@/modules/accounts/viewer";

/** Server-side guards for each workspace. They run on every render of the area. */

export async function CreatorGate({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer("/creator");
  if (!viewer.creator) redirect("/onboarding/creator");
  return children;
}

export async function CompanyGate({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer("/company");
  if (viewer.organizations.length === 0) redirect("/onboarding/company");
  return children;
}

export async function AdminGate({ children }: { children: React.ReactNode }) {
  const viewer = await requireViewer("/admin");
  // Do not reveal that the admin area exists to anyone else.
  if (!viewer.isAdmin) notFound();
  return children;
}
