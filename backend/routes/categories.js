const express = require('express');
const { Op } = require('sequelize');
const { Category, Recipe } = require('../models');
const auth = require('../middleware/auth');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { paginationValidation, idParamValidation, bulkIdsValidation } = require('../middleware/validate');

const router = express.Router();

// Get all categories (paginated)
router.get('/', auth, paginationValidation, async (req, res) => {
  try {
    const { page, limit, offset, sortBy, sortOrder, search } = getPaginationParams(req.query);
    const where = {};
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const allowedSortFields = ['name', 'created_at'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'name';

    const { count, rows } = await Category.findAndCountAll({
      where,
      order: [[orderField, sortOrder === 'DESC' ? 'DESC' : 'ASC']],
      limit, offset
    });
    res.json(buildPaginatedResponse(rows, count, page, limit));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single category with recipes
router.get('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      include: [{ model: Recipe, as: 'recipes' }]
    });
    if (!category) return res.status(404).json({ error: 'Category not found' });
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category
router.post('/', auth, async (req, res) => {
  try {
    const category = await Category.create(req.body);
    res.status(201).json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update category
router.put('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await category.update(req.body);
    res.json(category);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete category
router.delete('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    if (!category) return res.status(404).json({ error: 'Category not found' });
    await category.destroy();
    res.json({ message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete
router.post('/bulk-delete', auth, bulkIdsValidation, async (req, res) => {
  try {
    const { ids } = req.body;
    const deleted = await Category.destroy({ where: { id: ids } });
    res.json({ message: `${deleted} categories deleted`, deleted });
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
    await Category.update(updates, { where: { id: ids } });
    const updated = await Category.findAll({ where: { id: ids } });
    res.json({ message: `${updated.length} categories updated`, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
