const express = require('express');
const { Op } = require('sequelize');
const { NutritionLog } = require('../models');
const auth = require('../middleware/auth');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { paginationValidation, idParamValidation, bulkIdsValidation } = require('../middleware/validate');

const router = express.Router();

// Get all nutrition logs (paginated)
router.get('/', auth, paginationValidation, async (req, res) => {
  try {
    const { page, limit, offset, sortBy, sortOrder, search } = getPaginationParams(req.query);
    const where = { userId: req.user.id };
    if (search) where.notes = { [Op.iLike]: `%${search}%` };
    if (req.query.mealType) where.mealType = req.query.mealType;

    const allowedSortFields = ['date', 'created_at', 'calories', 'mealType'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'date';

    const { count, rows } = await NutritionLog.findAndCountAll({
      where,
      order: [[orderField, sortOrder]],
      limit, offset
    });
    res.json(buildPaginatedResponse(rows, count, page, limit));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single nutrition log
router.get('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const log = await NutritionLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ error: 'Nutrition log not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logs by date
router.get('/date/:date', auth, async (req, res) => {
  try {
    const logs = await NutritionLog.findAll({
      where: { userId: req.user.id, date: req.params.date },
      order: [['mealType', 'ASC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create nutrition log
router.post('/', auth, async (req, res) => {
  try {
    const log = await NutritionLog.create({ ...req.body, userId: req.user.id });
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update nutrition log
router.put('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const log = await NutritionLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ error: 'Nutrition log not found' });
    await log.update(req.body);
    res.json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete nutrition log
router.delete('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const log = await NutritionLog.findByPk(req.params.id);
    if (!log) return res.status(404).json({ error: 'Nutrition log not found' });
    await log.destroy();
    res.json({ message: 'Nutrition log deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete
router.post('/bulk-delete', auth, bulkIdsValidation, async (req, res) => {
  try {
    const { ids } = req.body;
    const deleted = await NutritionLog.destroy({ where: { id: ids, userId: req.user.id } });
    res.json({ message: `${deleted} nutrition logs deleted`, deleted });
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
    await NutritionLog.update(updates, { where: { id: ids, userId: req.user.id } });
    const updated = await NutritionLog.findAll({ where: { id: ids, userId: req.user.id } });
    res.json({ message: `${updated.length} nutrition logs updated`, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
