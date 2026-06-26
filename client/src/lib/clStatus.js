export function parseClStatusCode(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  const str = String(value).trim();
  if (!str) return null;

  const bracket = str.match(/^\[(\d+)\]/);
  if (bracket) return Number(bracket[1]);

  const asNum = Number(str);
  if (Number.isFinite(asNum) && /^\d+$/.test(str)) return Math.trunc(asNum);

  return null;
}

export function statusByCode(clStatuses, code) {
  if (code === null || code === undefined) return null;
  return (clStatuses || []).find((s) => Number(s.code) === Number(code)) ?? null;
}

export function formatStatusLabel(clStatuses, code) {
  const status = statusByCode(clStatuses, code);
  if (status) return `[${status.code}] ${status.label}`;
  if (code === null) return 'Unknown';
  return `[${code}] Unknown`;
}

export function colorForStatus(clStatuses, code) {
  const status = statusByCode(clStatuses, code);
  return status?.color ?? '#64748b';
}
