import { Router } from 'express';
import {
  listRecipes,
  getRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from '../lib/recipesStore.js';

const router = Router();

router.get('/recipes', async (_req, res) => {
  try {
    const recipes = await listRecipes();
    return res.json(recipes);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.get('/recipes/:product', async (req, res) => {
  try {
    const recipe = await getRecipe(req.params.product);
    if (!recipe) {
      return res.status(404).json({ error: `Recipe "${req.params.product}" not found.` });
    }
    return res.json(recipe);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

router.post('/recipes', async (req, res) => {
  try {
    const recipe = await createRecipe(req.body);
    return res.status(201).json(recipe);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.put('/recipes/:product', async (req, res) => {
  try {
    const recipe = await updateRecipe(req.params.product, req.body);
    return res.json(recipe);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

router.delete('/recipes/:product', async (req, res) => {
  try {
    const result = await deleteRecipe(req.params.product);
    return res.json(result);
  } catch (err) {
    return res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
