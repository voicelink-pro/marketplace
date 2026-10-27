import 'server-only';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireViewer } from '@/modules/accounts/viewer';
import { logUnexpected } from '@/lib/log';
import { financeWorkspaceSchema } from './schemas';

export async function getFinanceWorkspace(appId?: string, admin = false) {
  const viewer = await requireViewer();
  if (admin && !viewer.isAdmin) notFound();
  const client = await createClient();
  const result = await client.rpc('finance_workspace', { p_app_id: appId, p_admin: admin });
  if (result.error) {
    logUnexpected('finance.workspace', { code: result.error.code, message: 'Finance workspace unavailable.' });
    throw new Error('Finance information is temporarily unavailable.');
  }
  return financeWorkspaceSchema.parse(result.data);
}
