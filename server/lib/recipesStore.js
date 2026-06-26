import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../data/recipes.json');

const TOTAL_TOLERANCE = 0.01;

export function validateRecipe(recipe, { existingProducts = [] } = {}) {
  const product = String(recipe.product ?? '').trim();
  if (!product) {
    return 'Product name is required.';
  }

  const fields = ['esm', 'oil', 'starch', 'wv'];
  const values = {};
  for (const field of fields) {
    const value = Number(recipe[field]);
    if (!Number.isFinite(value) || value < 0) {
      return `${field.toUpperCase()} must be a non-negative number.`;
    }
    values[field] = value;
  }

  const total = values.esm + values.oil + values.starch + values.wv;
  if (Math.abs(total - 100) > TOTAL_TOLERANCE) {
    return `Ingredient percentages must sum to 100 (currently ${total.toFixed(2)}).`;
  }

  if (existingProducts.includes(product)) {
    return `Recipe "${product}" already exists.`;
  }

  return null;
}

function normalizeRecipe(recipe) {
  return {
    product: String(recipe.product).trim(),
    esm: Number(recipe.esm),
    oil: Number(recipe.oil),
    starch: Number(recipe.starch),
    wv: Number(recipe.wv),
    updatedAt: new Date().toISOString(),
  };
}

async function readAll() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data;
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeAll(recipes) {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, `${JSON.stringify(recipes, null, 2)}\n`, 'utf8');
}

export async function listRecipes() {
  const recipes = await readAll();
  return recipes.sort((a, b) => a.product.localeCompare(b.product));
}

export async function getRecipe(product) {
  const key = String(product).trim();
  const recipes = await readAll();
  return recipes.find((r) => r.product === key) ?? null;
}

export async function createRecipe(recipe) {
  const recipes = await readAll();
  const existingProducts = recipes.map((r) => r.product);
  const error = validateRecipe(recipe, { existingProducts });
  if (error) {
    const err = new Error(error);
    err.status = existingProducts.includes(String(recipe.product ?? '').trim()) ? 409 : 400;
    throw err;
  }

  const normalized = normalizeRecipe(recipe);
  recipes.push(normalized);
  await writeAll(recipes);
  return normalized;
}

export async function updateRecipe(product, recipe) {
  const key = String(product).trim();
  const recipes = await readAll();
  const index = recipes.findIndex((r) => r.product === key);
  if (index === -1) {
    const err = new Error(`Recipe "${key}" not found.`);
    err.status = 404;
    throw err;
  }

  const incomingProduct = String(recipe.product ?? key).trim();
  if (incomingProduct !== key) {
    const duplicate = recipes.some((r) => r.product === incomingProduct);
    if (duplicate) {
      const err = new Error(`Recipe "${incomingProduct}" already exists.`);
      err.status = 409;
      throw err;
    }
  }

  const error = validateRecipe({ ...recipe, product: incomingProduct });
  if (error) {
    const err = new Error(error);
    err.status = 400;
    throw err;
  }

  const normalized = normalizeRecipe({ ...recipe, product: incomingProduct });
  recipes[index] = normalized;
  await writeAll(recipes);
  return normalized;
}

export async function deleteRecipe(product) {
  const key = String(product).trim();
  const recipes = await readAll();
  const index = recipes.findIndex((r) => r.product === key);
  if (index === -1) {
    const err = new Error(`Recipe "${key}" not found.`);
    err.status = 404;
    throw err;
  }

  recipes.splice(index, 1);
  await writeAll(recipes);
  return { product: key };
}
