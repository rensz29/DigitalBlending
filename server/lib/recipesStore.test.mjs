import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('validateRecipe accepts valid recipe', async () => {
  const { validateRecipe } = await import('./recipesStore.js');
  assert.equal(
    validateRecipe({
      product: 'LCM',
      esm: 14.52,
      oil: 73.77,
      starch: 0,
      wv: 11.71,
    }),
    null
  );
});

test('validateRecipe rejects when total is not 100', async () => {
  const { validateRecipe } = await import('./recipesStore.js');
  const error = validateRecipe({
    product: 'Bad',
    esm: 50,
    oil: 30,
    starch: 10,
    wv: 5,
  });
  assert.match(error, /sum to 100/);
});

test('validateRecipe rejects duplicate product', async () => {
  const { validateRecipe } = await import('./recipesStore.js');
  const error = validateRecipe(
    { product: 'LCM', esm: 25, oil: 25, starch: 25, wv: 25 },
    { existingProducts: ['LCM'] }
  );
  assert.match(error, /already exists/);
});

test('validateRecipe rejects negative values', async () => {
  const { validateRecipe } = await import('./recipesStore.js');
  const error = validateRecipe({
    product: 'Bad',
    esm: -1,
    oil: 50,
    starch: 25,
    wv: 26,
  });
  assert.match(error, /non-negative/);
});

test('createRecipe and deleteRecipe round-trip on temp data', async () => {
  const realDataFile = path.join(__dirname, '../data/recipes.json');
  const backup = await fs.readFile(realDataFile, 'utf8');
  const testProduct = `__TEST_${Date.now()}`;

  try {
    const { createRecipe, getRecipe, updateRecipe, deleteRecipe } = await import(
      './recipesStore.js'
    );

    const created = await createRecipe({
      product: testProduct,
      esm: 10,
      oil: 20,
      starch: 30,
      wv: 40,
    });
    assert.equal(created.product, testProduct);

    const fetched = await getRecipe(testProduct);
    assert.equal(fetched.esm, 10);

    const updated = await updateRecipe(testProduct, {
      product: testProduct,
      esm: 15,
      oil: 15,
      starch: 35,
      wv: 35,
    });
    assert.equal(updated.esm, 15);

    await deleteRecipe(testProduct);
    assert.equal(await getRecipe(testProduct), null);
  } finally {
    await fs.writeFile(realDataFile, backup, 'utf8');
  }
});

test('validateIngredientPrices accepts valid prices', async () => {
  const { validateIngredientPrices } = await import('./ingredientPricesStore.js');
  assert.equal(
    validateIngredientPrices({ esm: 10, oil: 5.5, wv: 2, starch: 3 }),
    null
  );
});

test('validateIngredientPrices rejects negative price', async () => {
  const { validateIngredientPrices } = await import('./ingredientPricesStore.js');
  const error = validateIngredientPrices({ esm: -1, oil: 0, wv: 0, starch: 0 });
  assert.match(error, /non-negative/);
});

test('updateIngredientPrice round-trip', async () => {
  const realDataFile = path.join(__dirname, '../data/ingredient-prices.json');
  const backup = await fs.readFile(realDataFile, 'utf8');

  try {
    const { getIngredientPrices, updateIngredientPrice } = await import(
      './ingredientPricesStore.js'
    );

    await updateIngredientPrice('esm', 12.34);
    const prices = await getIngredientPrices();
    assert.equal(prices.esm, 12.34);

    await updateIngredientPrice('esm', 0);
    const reset = await getIngredientPrices();
    assert.equal(reset.esm, 0);
  } finally {
    await fs.writeFile(realDataFile, backup, 'utf8');
  }
});
