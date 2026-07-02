import { INGREDIENTS } from './tags.js';
import { formatLocalTime } from './shifts.js';
import { isOpen, valueAt } from './metrics.js';

function round(n, dp = 2) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function openWindows(points, start, end) {
  const windows = [];
  if (!points?.length) return windows;

  for (let i = 0; i < points.length; i++) {
    const segStart = Math.max(points[i].t, start);
    const next = i + 1 < points.length ? points[i + 1].t : end;
    const segEnd = Math.min(next, end);
    if (segEnd > segStart && isOpen(points[i].value)) {
      windows.push({ start: segStart, end: segEnd });
    }
  }
  return windows;
}

function accumulateInWindow(points, start, end) {
  if (!points?.length) return 0;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Number(points[i].value) - Number(points[i - 1].value);
    if (!Number.isFinite(d) || d <= 0) continue;
    const mid = (points[i - 1].t + points[i].t) / 2;
    if (mid >= start && mid < end) total += d;
  }
  return total;
}

function pct(kg, totalKg) {
  if (!totalKg) return null;
  return round((kg / totalKg) * 100, 2);
}

function relativeError(actualPct, targetPct) {
  if (actualPct == null || targetPct == null || Number(targetPct) === 0) return null;
  return round(((actualPct - targetPct) / targetPct) * 100, 2);
}

export function computeDosingErrorsByWindow(series, range, recipes) {
  const { unixStart, unixEnd } = range;
  const skuSeries = series.sku || [];
  const recipeByProduct = new Map(
    (recipes || []).map((recipe) => [String(recipe.product).trim(), recipe])
  );

  return INGREDIENTS.flatMap((anchor) => {
    const anchorValve = series[anchor.valveKey] || [];
    const windows = openWindows(anchorValve, unixStart, unixEnd);

    return windows.map((window) => {
      const mid = (window.start + window.end) / 2;
      const sku = String(valueAt(skuSeries, mid) ?? 'Unknown').trim() || 'Unknown';
      const targetRecipe = recipeByProduct.get(sku);

      const kgByIngredient = Object.fromEntries(
        INGREDIENTS.map((ing) => [
          ing.id,
          round(accumulateInWindow(series[ing.dosedKey] || [], window.start, window.end), 3),
        ])
      );
      const windowTotalKg = round(
        Object.values(kgByIngredient).reduce((sum, value) => sum + Number(value || 0), 0),
        3
      );

      const actual = Object.fromEntries(
        INGREDIENTS.map((ing) => [ing.id, pct(kgByIngredient[ing.id], windowTotalKg)])
      );

      const hasTarget = Boolean(targetRecipe);
      const target = hasTarget
        ? {
            esm: Number(targetRecipe.esm),
            oil: Number(targetRecipe.oil),
            wv: Number(targetRecipe.wv),
            starch: Number(targetRecipe.starch),
          }
        : null;

      const errorPct = hasTarget
        ? Object.fromEntries(
            INGREDIENTS.map((ing) => [
              ing.id,
              relativeError(actual[ing.id], target[ing.id]),
            ])
          )
        : null;

      return {
        ingredientId: anchor.id,
        ingredientLabel: anchor.label,
        windowStart: window.start,
        windowEnd: window.end,
        startLabel: formatLocalTime(window.start),
        endLabel: formatLocalTime(window.end),
        sku,
        windowTotalKg,
        noDosing: windowTotalKg <= 0,
        hasTarget,
        actual,
        target,
        errorPct,
      };
    });
  }).sort((a, b) => a.windowStart - b.windowStart || a.ingredientLabel.localeCompare(b.ingredientLabel));
}
