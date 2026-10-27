import 'server-only';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/modules/accounts/viewer';
import { logUnexpected } from '@/lib/log';
import { adminOperationsSchema, inboxSchema } from './schemas';
export async function getOperationsInbox() {
  await requireViewer('/notifications');
  const client = await createClient();
  const r = await client.rpc('ops_inbox');
  if (r.error) { logUnexpected('operations.inbox', { code: r.error.code, message: 'Inbox unavailable.' }); throw new Error('Notifications and support are temporarily unavailable.'); }
  return inboxSchema.parse(r.data);
}
export async function getAdminOperations() {
  const viewer = await requireViewer('/admin/issues');
  if (!viewer.isAdmin) notFound();
  const client = await createClient();
  const r = await client.rpc('ops_admin_workspace');
  if (r.error) { logUnexpected('operations.admin', { code: r.error.code, message: 'Operations workspace unavailable.' }); throw new Error('Operations are temporarily unavailable.'); }
  return adminOperationsSchema.parse(r.data);
}
