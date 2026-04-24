const express = require('express');
const { Op } = require('sequelize');
const { Recipe, Category, User } = require('../models');
const auth = require('../middleware/auth');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { paginationValidation, idParamValidation, bulkIdsValidation } = require('../middleware/validate');

const router = express.Router();

// Get all recipes (with pagination, filter, sort, search)
router.get('/', auth, paginationValidation, async (req, res) => {
  try {
    const { page, limit, offset, sortBy, sortOrder, search, filter } = getPaginationParams(req.query);

    const where = {};
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { cuisine: { [Op.iLike]: `%${search}%` } }
      ];
    }
    if (filter) where.categoryId = filter;
    if (req.query.cuisine) where.cuisine = { [Op.iLike]: `%${req.query.cuisine}%` };

    const allowedSortFields = ['title', 'created_at', 'calories', 'prepTime', 'cookTime', 'servings'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    const { count, rows } = await Recipe.findAndCountAll({
      where,
      include: [{ model: Category, as: 'category' }],
      order: [[orderField, sortOrder]],
      limit,
      offset
    });

    res.json(buildPaginatedResponse(rows, count, page, limit));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single recipe
router.get('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id, {
      include: [
        { model: Category, as: 'category' },
        { model: User, as: 'user', attributes: ['id', 'name', 'email'] }
      ]
    });
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create recipe
router.post('/', auth, async (req, res) => {
  try {
    const recipe = await Recipe.create({
      ...req.body,
      userId: req.user.id
    });
    const fullRecipe = await Recipe.findByPk(recipe.id, {
      include: [{ model: Category, as: 'category' }]
    });
    res.status(201).json(fullRecipe);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update recipe
router.put('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    await recipe.update(req.body);
    const updatedRecipe = await Recipe.findByPk(recipe.id, {
      include: [{ model: Category, as: 'category' }]
    });
    res.json(updatedRecipe);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete recipe
router.delete('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }
    await recipe.destroy();
    res.json({ message: 'Recipe deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete recipes
router.post('/bulk-delete', auth, bulkIdsValidation, async (req, res) => {
  try {
    const { ids } = req.body;
    const deleted = await Recipe.destroy({ where: { id: ids } });
    res.json({ message: `${deleted} recipes deleted`, deleted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk update recipes
router.put('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }
    await Recipe.update(updates, { where: { id: ids } });
    const updated = await Recipe.findAll({
      where: { id: ids },
      include: [{ model: Category, as: 'category' }]
    });
    res.json({ message: `${updated.length} recipes updated`, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
