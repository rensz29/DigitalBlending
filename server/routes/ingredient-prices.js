import { Router } from 'express';
import {
  getIngredientPrices,
  updateIngredientPrices,
  updateIngredientPrice,
  INGREDIENT_KEYS,
} from '../lib/ingredientPricesStore.js';

const router = Router();

router.get('/ingredient-prices', async (_req, res) => {
  try {
    const prices = await getIngredientPrices();
    return res.json(prices);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.put('/ingredient-prices', async (req, res) => {
  try {
    const prices = await updateIngredientPrices(req.body);
    return res.json(prices);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.put('/ingredient-prices/:ingredient', async (req, res) => {
  const { ingredient } = req.params;
  if (!INGREDIENT_KEYS.includes(ingredient)) {
    return res.status(400).json({ error: `Unknown ingredient "${ingredient}".` });
  }

  try {
    const prices = await updateIngredientPrice(ingredient, req.body.pricePerKg);
    return res.json(prices);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
