const express = require('express');
const { Op } = require('sequelize');
const { CookingTimer, Recipe } = require('../models');
const auth = require('../middleware/auth');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { paginationValidation, idParamValidation, bulkIdsValidation } = require('../middleware/validate');

const router = express.Router();

router.get('/', auth, paginationValidation, async (req, res) => {
  try {
    const { page, limit, offset, sortBy, sortOrder, search } = getPaginationParams(req.query);
    const where = { userId: req.user.id };
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    const allowedSortFields = ['name', 'createdAt', 'totalTime', 'status'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const { count, rows } = await CookingTimer.findAndCountAll({
      where, include: [{ model: Recipe, as: 'recipe' }],
      order: [[orderField, sortOrder]], limit, offset, distinct: true
    });
    res.json(buildPaginatedResponse(rows, count, page, limit));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const timer = await CookingTimer.findOne({
      where: { id: req.params.id, userId: req.user.id },
      include: [{ model: Recipe, as: 'recipe' }]
    });
    if (!timer) return res.status(404).json({ error: 'Timer not found' });
    res.json(timer);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const timer = await CookingTimer.create({ ...req.body, userId: req.user.id });
    res.status(201).json(timer);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const timer = await CookingTimer.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!timer) return res.status(404).json({ error: 'Timer not found' });
    await timer.update(req.body);
    res.json(timer);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const timer = await CookingTimer.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!timer) return res.status(404).json({ error: 'Timer not found' });
    await timer.destroy();
    res.json({ message: 'Timer deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/bulk-delete', auth, bulkIdsValidation, async (req, res) => {
  try {
    const deleted = await CookingTimer.destroy({ where: { id: req.body.ids, userId: req.user.id } });
    res.json({ message: `${deleted} timers deleted`, deleted });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Bulk update
router.put('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }
    await CookingTimer.update(updates, { where: { id: ids, userId: req.user.id } });
    const updated = await CookingTimer.findAll({ where: { id: ids, userId: req.user.id } });
    res.json({ message: `${updated.length} timers updated`, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
