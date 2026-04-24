const express = require('express');
const { Op } = require('sequelize');
const { Ingredient } = require('../models');
const auth = require('../middleware/auth');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { paginationValidation, idParamValidation, bulkIdsValidation } = require('../middleware/validate');

const router = express.Router();

// Get all ingredients (paginated)
router.get('/', auth, paginationValidation, async (req, res) => {
  try {
    const { page, limit, offset, sortBy, sortOrder, search } = getPaginationParams(req.query);
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { category: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (req.query.category) where.category = req.query.category;

    const allowedSortFields = ['name', 'caloriesPer100g', 'protein', 'carbs', 'fat', 'category'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'name';

    const { count, rows } = await Ingredient.findAndCountAll({
      where,
      order: [[orderField, sortOrder === 'DESC' ? 'DESC' : 'ASC']],
      limit, offset
    });
    res.json(buildPaginatedResponse(rows, count, page, limit));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single ingredient
router.get('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id);
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search ingredients
router.get('/search/:query', auth, async (req, res) => {
  try {
    const ingredients = await Ingredient.findAll({
      where: { name: { [Op.iLike]: `%${req.params.query}%` } },
      order: [['name', 'ASC']]
    });
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create ingredient
router.post('/', auth, async (req, res) => {
  try {
    const ingredient = await Ingredient.create(req.body);
    res.status(201).json(ingredient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update ingredient
router.put('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id);
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });
    await ingredient.update(req.body);
    res.json(ingredient);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete ingredient
router.delete('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id);
    if (!ingredient) return res.status(404).json({ error: 'Ingredient not found' });
    await ingredient.destroy();
    res.json({ message: 'Ingredient deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete
router.post('/bulk-delete', auth, bulkIdsValidation, async (req, res) => {
  try {
    const { ids } = req.body;
    const deleted = await Ingredient.destroy({ where: { id: ids } });
    res.json({ message: `${deleted} ingredients deleted`, deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update
router.put('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }
    await Ingredient.update(updates, { where: { id: ids } });
    const updated = await Ingredient.findAll({ where: { id: ids } });
    res.json({ message: `${updated.length} ingredients updated`, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
