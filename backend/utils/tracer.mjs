// Minimal tracer stub to prepare for OpenTelemetry integration later
// No external deps: emits structured logs via secureLogger

import { secureLogger } from './secure-logger.mjs';

export class Tracer {
  constructor({ serviceName = 'jizai-backend' } = {}) {
    this.serviceName = serviceName;
  }

  startSpan(name, attrs = {}) {
    const start = Date.now();
    const spanId = Math.random().toString(16).slice(2, 10);
    const traceId = attrs.traceId || Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2);
    const base = { serviceName: this.serviceName, traceId, spanId, name, ...attrs };
    return {
      end: (err = null, moreAttrs = {}) => {
        const durationMs = Date.now() - start;
        const level = err ? 'error' : 'info';
        const data = { ...base, ...moreAttrs, durationMs };
        secureLogger[level]('trace_span', data);
      },
    };
  }
}

export const tracer = new Tracer();
export default tracer;

