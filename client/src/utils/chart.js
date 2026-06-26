export const MAX_CHART_POINTS = 120;

export function toChartNumber(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") {
      return null;
    }
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

export function appendPoint(history, nodeId, value, maxPoints = MAX_CHART_POINTS) {
  const numeric = toChartNumber(value);
  if (numeric === null) {
    return history;
  }

  const series = history[nodeId] || [];
  const nextPoint = { t: Date.now(), v: numeric };
  const nextSeries =
    series.length >= maxPoints
      ? [...series.slice(series.length - maxPoints + 1), nextPoint]
      : [...series, nextPoint];

  return {
    ...history,
    [nodeId]: nextSeries,
  };
}

export function appendPointsFromValues(history, values, maxPoints = MAX_CHART_POINTS) {
  let next = history;

  for (const item of values) {
    if (item.statusCode !== "Good") {
      continue;
    }
    next = appendPoint(next, item.nodeId, item.value, maxPoints);
  }

  return next;
}

export function formatChartTime(timestamp) {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
