import type { Instrumentation } from 'next';
import { logUnexpected } from '@/lib/log';
/** Fixed metadata only: error messages, request URLs, headers and payloads can contain secrets. */
export const onRequestError: Instrumentation.onRequestError = (_error, _request, context) => {
  logUnexpected('server.request', { code: 'REQUEST_' + context.routeType.toUpperCase(), message: 'A server request failed. Check the server error boundary and operational queues.' });
};
