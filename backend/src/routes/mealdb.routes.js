import express from 'express';
import { filterByIngredient, lookupById, searchByName } from '../controllers/mealdb.controller.js';

const router = express.Router();

router.get('/filter', filterByIngredient);
router.get('/search', searchByName);
router.get('/lookup/:id', lookupById);

export default router;
