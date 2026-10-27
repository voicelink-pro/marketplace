/** Reports liveness only; queue failures are separate signals. No payloads or credentials are logged. */
export async function reportWorkerHealth(client, backend, worker, scope, ok) {
  const r = await client.rpc('ops_worker_heartbeat', { p_backend: backend, p_worker: worker, p_scope: scope, p_ok: ok });
  if (r.error) console.error('Worker health report unavailable.');
  return !r.error;
}
export function evaluateOperationsHealth(health) {
  const workers = health.workers.filter(worker => worker.state !== 'ok').map(worker => worker.worker + ':' + worker.state);
  const queues = ['payment_attention', 'commission_attention', 'finance_attention'].filter(key => health[key] > 0);
  return { status: workers.length || queues.length ? 'attention' : 'ok', workers, queues, counts: { payment: health.payment_attention, commission: health.commission_attention, finance: health.finance_attention, open_tickets: health.open_tickets }, live_enabled: false };
}
