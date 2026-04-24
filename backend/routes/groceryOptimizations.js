const express = require('express');
const { Op } = require('sequelize');
const { GroceryOptimization } = require('../models');
const auth = require('../middleware/auth');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { paginationValidation, idParamValidation, bulkIdsValidation } = require('../middleware/validate');

const router = express.Router();

router.get('/', auth, paginationValidation, async (req, res) => {
  try {
    const { page, limit, offset, sortBy, sortOrder, search } = getPaginationParams(req.query);
    const where = { userId: req.user.id };
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    const allowedSortFields = ['name', 'createdAt', 'budget', 'estimatedSavings'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const { count, rows } = await GroceryOptimization.findAndCountAll({ where, order: [[orderField, sortOrder]], limit, offset });
    res.json(buildPaginatedResponse(rows, count, page, limit));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const optimization = await GroceryOptimization.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!optimization) return res.status(404).json({ error: 'Optimization not found' });
    res.json(optimization);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const optimization = await GroceryOptimization.create({ ...req.body, userId: req.user.id });
    res.status(201).json(optimization);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const optimization = await GroceryOptimization.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!optimization) return res.status(404).json({ error: 'Optimization not found' });
    await optimization.update(req.body);
    res.json(optimization);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const optimization = await GroceryOptimization.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!optimization) return res.status(404).json({ error: 'Optimization not found' });
    await optimization.destroy();
    res.json({ message: 'Optimization deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/bulk-delete', auth, bulkIdsValidation, async (req, res) => {
  try {
    const deleted = await GroceryOptimization.destroy({ where: { id: req.body.ids, userId: req.user.id } });
    res.json({ message: `${deleted} optimizations deleted`, deleted });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Bulk update
router.put('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }
    await GroceryOptimization.update(updates, { where: { id: ids, userId: req.user.id } });
    const updated = await GroceryOptimization.findAll({ where: { id: ids, userId: req.user.id } });
    res.json({ message: `${updated.length} optimizations updated`, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
