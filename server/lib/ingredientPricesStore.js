import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data/ingredient-prices.json');

export const INGREDIENT_KEYS = ['esm', 'oil', 'wv', 'starch'];

const DEFAULT_PRICES = {
  esm: 0,
  oil: 0,
  wv: 0,
  starch: 0,
};

export function validateIngredientPrices(prices) {
  for (const key of INGREDIENT_KEYS) {
    const value = Number(prices[key]);
    if (!Number.isFinite(value) || value < 0) {
      return `${key.toUpperCase()} price per kg must be a non-negative number.`;
    }
  }
  return null;
}

function normalizePrices(prices) {
  return {
    esm: Number(prices.esm),
    oil: Number(prices.oil),
    wv: Number(prices.wv),
    starch: Number(prices.starch),
    updatedAt: new Date().toISOString(),
  };
}

async function readPrices() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    return { ...DEFAULT_PRICES, ...data };
  } catch (err) {
    if (err.code === 'ENOENT') return { ...DEFAULT_PRICES };
    throw err;
  }
}

async function writePrices(prices) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(prices, null, 2)}\n`, 'utf8');
}

export async function getIngredientPrices() {
  const prices = await readPrices();
  return normalizePrices(prices);
}

export async function updateIngredientPrices(prices) {
  const error = validateIngredientPrices(prices);
  if (error) {
    const err = new Error(error);
    err.status = 400;
    throw err;
  }

  const normalized = normalizePrices(prices);
  await writePrices(normalized);
  return normalized;
}

export async function updateIngredientPrice(key, value) {
  if (!INGREDIENT_KEYS.includes(key)) {
    const err = new Error(`Unknown ingredient "${key}".`);
    err.status = 400;
    throw err;
  }

  const prices = await readPrices();
  const error = validateIngredientPrices({ ...prices, [key]: value });
  if (error) {
    const err = new Error(error);
    err.status = 400;
    throw err;
  }

  return updateIngredientPrices({ ...prices, [key]: value });
}
