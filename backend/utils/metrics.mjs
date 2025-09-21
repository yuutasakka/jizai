// Minimal in-memory metrics (Prometheus exposition format)
// No external deps to keep footprint small

const counters = new Map();
const summaries = new Map();

function inc(name, labels = {}, value = 1) {
  const key = metricKey(name, labels);
  counters.set(key, (counters.get(key) || 0) + value);
}

function observe(name, labels = {}, ms) {
  const key = metricKey(name, labels);
  const rec = summaries.get(key) || { count: 0, sum: 0, min: Infinity, max: -Infinity };
  rec.count += 1;
  rec.sum += ms;
  if (ms < rec.min) rec.min = ms;
  if (ms > rec.max) rec.max = ms;
  summaries.set(key, rec);
}

function metricKey(name, labels) {
  const parts = Object.keys(labels)
    .sort()
    .map(k => `${k}=${String(labels[k]).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}`)
    .join(',');
  return `${name}{${parts}}`;
}

function serialize() {
  const lines = [];
  // Counters
  for (const [k, v] of counters.entries()) {
    lines.push(`# TYPE ${k.split('{')[0]} counter`);
    lines.push(`${k} ${v}`);
  }
  // Summaries as two gauges each: _count and _sum (Prometheus summary-style)
  for (const [k, rec] of summaries.entries()) {
    const base = k.split('{')[0];
    const labels = k.substring(k.indexOf('{'));
    lines.push(`# TYPE ${base}_count counter`);
    lines.push(`${base}_count${labels} ${rec.count}`);
    lines.push(`# TYPE ${base}_sum counter`);
    lines.push(`${base}_sum${labels} ${rec.sum}`);
    // also expose min/max as gauges for quick visibility
    if (Number.isFinite(rec.min)) lines.push(`${base}_min${labels} ${rec.min}`);
    if (Number.isFinite(rec.max)) lines.push(`${base}_max${labels} ${rec.max}`);
  }
  return lines.join('\n') + '\n';
}

export const metrics = {
  inc,
  observe,
  serialize
};

export default metrics;

