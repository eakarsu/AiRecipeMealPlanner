const express = require('express');
const { Op } = require('sequelize');
const { NutritionBalance } = require('../models');
const auth = require('../middleware/auth');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { paginationValidation, idParamValidation, bulkIdsValidation } = require('../middleware/validate');

const router = express.Router();

router.get('/', auth, paginationValidation, async (req, res) => {
  try {
    const { page, limit, offset, sortBy, sortOrder, search } = getPaginationParams(req.query);
    const where = { userId: req.user.id };
    if (search) where.name = { [Op.iLike]: `%${search}%` };
    const allowedSortFields = ['name', 'date', 'createdAt', 'balanceScore'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'date';
    const { count, rows } = await NutritionBalance.findAndCountAll({ where, order: [[orderField, sortOrder]], limit, offset });
    res.json(buildPaginatedResponse(rows, count, page, limit));
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.get('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const balance = await NutritionBalance.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!balance) return res.status(404).json({ error: 'Balance not found' });
    res.json(balance);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const balance = await NutritionBalance.create({ ...req.body, userId: req.user.id });
    res.status(201).json(balance);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.put('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const balance = await NutritionBalance.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!balance) return res.status(404).json({ error: 'Balance not found' });
    await balance.update(req.body);
    res.json(balance);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.delete('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const balance = await NutritionBalance.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!balance) return res.status(404).json({ error: 'Balance not found' });
    await balance.destroy();
    res.json({ message: 'Balance deleted successfully' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

router.post('/bulk-delete', auth, bulkIdsValidation, async (req, res) => {
  try {
    const deleted = await NutritionBalance.destroy({ where: { id: req.body.ids, userId: req.user.id } });
    res.json({ message: `${deleted} balances deleted`, deleted });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Bulk update
router.put('/bulk-update', auth, async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'ids must be a non-empty array' });
    }
    await NutritionBalance.update(updates, { where: { id: ids, userId: req.user.id } });
    const updated = await NutritionBalance.findAll({ where: { id: ids, userId: req.user.id } });
    res.json({ message: `${updated.length} balances updated`, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
