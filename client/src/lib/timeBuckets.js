export const TZ_OFFSET = 8; // Asia/Manila

export const BUCKET_OPTIONS = [
  { label: '1 sec', seconds: 1 },
  { label: '30 sec', seconds: 30 },
  { label: '1 min', seconds: 60 },
  { label: '15 min', seconds: 900 },
  { label: '30 min', seconds: 1800 },
  { label: '1 hr', seconds: 3600 },
  { label: '2 hr', seconds: 7200 },
  { label: '4 hr', seconds: 14400 },
];

export const DEFAULT_BUCKET_SECONDS = 900;

export const DOSE_DISPLAY_OPTIONS = [
  { id: 'increment', label: 'Increment' },
  { id: 'cumulative', label: 'Total value' },
];

export const DEFAULT_DOSE_DISPLAY = 'increment';

export function fmtTime(unix, includeSeconds = false) {
  const d = new Date((unix + TZ_OFFSET * 3600) * 1000);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  if (includeSeconds) {
    const ss = String(d.getUTCSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  }
  return `${hh}:${mm}`;
}

export function fmtTimeRange(start, end) {
  const includeSeconds = end - start < 60;
  return `${fmtTime(start, includeSeconds)}–${fmtTime(end, includeSeconds)}`;
}

// Collapse consecutive segments that share the same value into one contiguous
// segment. Keeps timeline bars lightweight (esp. at second-level intervals,
// where a long unchanging run would otherwise emit one node per bucket).
export function mergeSegments(segments) {
  if (!segments || segments.length === 0) return [];
  const merged = [{ ...segments[0] }];
  for (let i = 1; i < segments.length; i++) {
    const prev = merged[merged.length - 1];
    const cur = segments[i];
    if (Object.is(cur.value, prev.value) && cur.start <= prev.end) {
      prev.end = cur.end;
    } else {
      merged.push({ ...cur });
    }
  }
  return merged;
}

export function buildSegments(points, start, end) {
  if (!points || points.length === 0) return [];
  const segs = [];
  for (let i = 0; i < points.length; i++) {
    const segStart = Math.max(points[i].t, start);
    const next = i + 1 < points.length ? points[i + 1].t : end;
    const segEnd = Math.min(next, end);
    if (segEnd > segStart) {
      segs.push({ start: segStart, end: segEnd, value: points[i].value });
    }
  }
  return segs;
}

function valueAt(points, t) {
  let v;
  for (const p of points) {
    if (p.t <= t) v = p.value;
    else break;
  }
  return v;
}

function activeSecondsInRange(points, isActive, start, end) {
  const segs = buildSegments(points, start, end);
  let total = 0;
  for (const s of segs) {
    if (isActive(s.value)) total += s.end - s.start;
  }
  return total;
}

export function buildBuckets(range, bucketSeconds) {
  const { unixStart, unixEnd } = range;
  const buckets = [];
  let start = unixStart;
  while (start < unixEnd) {
    const end = Math.min(start + bucketSeconds, unixEnd);
    buckets.push({
      start,
      end,
      mid: (start + end) / 2,
      label: fmtTime(start, bucketSeconds < 60),
    });
    start = end;
  }
  return buckets;
}

export function bucketStateSegments(points, range, bucketSeconds, isActive) {
  const buckets = buildBuckets(range, bucketSeconds);
  const segments = [];

  for (const bucket of buckets) {
    const duration = bucket.end - bucket.start;
    if (!duration) continue;

    const activeSec = activeSecondsInRange(points, isActive, bucket.start, bucket.end);
    const inactiveSec = duration - activeSec;

    if (activeSec > 0) {
      segments.push({
        start: bucket.start,
        end: bucket.start + activeSec,
        value: 'active',
      });
    }
    if (inactiveSec > 0) {
      segments.push({
        start: bucket.start + activeSec,
        end: bucket.end,
        value: 'inactive',
      });
    }
  }

  return segments;
}

export function bucketDosedSeries(points, range, bucketSeconds) {
  const buckets = buildBuckets(range, bucketSeconds);

  return buckets.map((bucket) => {
    let total = 0;
    for (let i = 1; i < (points || []).length; i++) {
      const d = Number(points[i].value) - Number(points[i - 1].value);
      if (!Number.isFinite(d) || d <= 0) continue;
      const mid = (points[i - 1].t + points[i].t) / 2;
      if (mid >= bucket.start && mid < bucket.end) total += d;
    }
    return {
      t: bucket.mid,
      label: bucket.label,
      value: Math.round(total * 10) / 10,
    };
  });
}

export function bucketDosedCumulativeSeries(points, range, bucketSeconds) {
  const buckets = buildBuckets(range, bucketSeconds);

  return buckets.map((bucket) => {
    const raw = valueAt(points || [], bucket.end - 1) ?? valueAt(points || [], bucket.mid);
    const value = Number(raw);
    return {
      t: bucket.mid,
      label: bucket.label,
      value: Number.isFinite(value) ? Math.round(value * 10) / 10 : 0,
    };
  });
}

export function dosedSeriesForMode(points, range, bucketSeconds, mode) {
  if (mode === 'cumulative') {
    return bucketDosedCumulativeSeries(points, range, bucketSeconds);
  }
  return bucketDosedSeries(points, range, bucketSeconds);
}

export function bucketSkuSegments(points, range, bucketSeconds) {
  const buckets = buildBuckets(range, bucketSeconds);

  return buckets.map((bucket) => ({
    start: bucket.start,
    end: bucket.end,
    value: String(valueAt(points || [], bucket.mid) ?? '').trim() || 'Unknown',
  }));
}

export function bucketClStatusSegments(points, range, bucketSeconds, parseCode) {
  const buckets = buildBuckets(range, bucketSeconds);
  const parse = parseCode ?? ((v) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.trunc(n) : null;
  });

  return buckets.map((bucket) => {
    const raw = valueAt(points || [], bucket.mid);
    const code = parse(raw);
    return {
      start: bucket.start,
      end: bucket.end,
      value: code,
    };
  });
}

function averageFlowInRange(points, start, end) {
  const segs = buildSegments(points, start, end);
  let weightedSum = 0;
  let totalSeconds = 0;

  for (const seg of segs) {
    const duration = seg.end - seg.start;
    if (duration <= 0) continue;
    const value = Number(seg.value);
    if (!Number.isFinite(value) || value < 0) continue;
    weightedSum += value * duration;
    totalSeconds += duration;
  }

  if (!totalSeconds) return 0;
  return Math.round((weightedSum / totalSeconds) * 100) / 100;
}

export function bucketFlowrateSeries(points, range, bucketSeconds) {
  const buckets = buildBuckets(range, bucketSeconds);

  return buckets.map((bucket) => ({
    t: bucket.mid,
    label: bucket.label,
    value: averageFlowInRange(points || [], bucket.start, bucket.end),
  }));
}

export function bucketValveDutySeries(points, range, bucketSeconds, isActive) {
  const buckets = buildBuckets(range, bucketSeconds);

  return buckets.map((bucket) => {
    const duration = bucket.end - bucket.start;
    if (!duration) {
      return { t: bucket.mid, label: bucket.label, value: 0 };
    }
    const activeSec = activeSecondsInRange(points, isActive, bucket.start, bucket.end);
    const pct = Math.round((activeSec / duration) * 1000) / 10;
    return { t: bucket.mid, label: bucket.label, value: pct };
  });
}
