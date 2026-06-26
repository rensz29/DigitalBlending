import { INGREDIENTS } from './tags.js';

export const VARIANCE_TOLERANCE_PP = 2;

const INGREDIENT_IDS = INGREDIENTS.map((ing) => ing.id);

function round(n, dp) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function kgFieldFor(id) {
  const ing = INGREDIENTS.find((i) => i.id === id);
  return ing?.kgField ?? `${id}Kg`;
}

function pctFromKg(kg, totalKg) {
  if (!totalKg) return null;
  return round((kg / totalKg) * 100, 2);
}

function buildPctMap(row, totalKg, prefix) {
  const result = {};
  for (const id of INGREDIENT_IDS) {
    const value = row?.[prefix === 'target' ? id : kgFieldFor(id)];
    result[id] = prefix === 'target' ? (value ?? null) : pctFromKg(Number(row[kgFieldFor(id)] ?? 0), totalKg);
  }
  return result;
}

function buildVariance(actual, target) {
  const variance = {};
  for (const id of INGREDIENT_IDS) {
    if (actual[id] == null || target[id] == null) {
      variance[id] = null;
    } else {
      variance[id] = round(actual[id] - target[id], 2);
    }
  }
  return variance;
}

export function isWithinTolerance(variance) {
  if (variance == null) return null;
  return Math.abs(variance) <= VARIANCE_TOLERANCE_PP;
}

export function compareToTargets(skuBreakdown, recipes) {
  const recipeByProduct = new Map(
    (recipes || []).map((recipe) => [String(recipe.product).trim(), recipe])
  );

  return (skuBreakdown || []).map((row) => {
    const sku = String(row.sku ?? '').trim();
    const totalKg = round(
      INGREDIENT_IDS.reduce((sum, id) => sum + Number(row[kgFieldFor(id)] ?? 0), 0),
      1
    );

    const actual = buildPctMap(row, totalKg, 'actual');
    const targetRecipe = recipeByProduct.get(sku);
    const hasTarget = Boolean(targetRecipe);

    const target = hasTarget
      ? {
          esm: targetRecipe.esm,
          oil: targetRecipe.oil,
          starch: targetRecipe.starch,
          wv: targetRecipe.wv,
        }
      : null;

    const variance = hasTarget && totalKg > 0 ? buildVariance(actual, target) : null;

    return {
      sku,
      totalKg,
      hasTarget,
      target,
      actual,
      variance,
    };
  });
}
