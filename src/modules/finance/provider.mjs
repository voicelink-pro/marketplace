/** Provider contract: execute with a stable key, then reconcile authoritative evidence.
 * The test provider persists its objects separately from marketplace accounting.
 * No live adapter is registered. Credentials for app sales are never used here.
 */
export function sandboxProvider(client, backend) {
  const rpc = async (name, args) => {
    const result = await client.rpc(name, { p_backend: backend, ...args });
    if (result.error) throw new Error('Finance provider request failed.');
    return result.data;
  };
  return {
    name: 'sandbox-test',
    async execute(job) {
      const result = await rpc('finance_sandbox_exchange', { p_job: job.id, p_lease: job.lease });
      if (result?.unknown) {
        await rpc('finance_defer', { p_job: job.id, p_lease: job.lease });
        return 'unknown';
      }
      // State and amounts are retrieved by settle, never trusted from this response.
      return rpc('finance_settle', { p_job: job.id, p_lease: job.lease });
    },
  };
}
