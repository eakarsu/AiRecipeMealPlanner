const express = require('express');
const { Op } = require('sequelize');
const { MealPlan, MealPlanItem, Recipe, Category } = require('../models');
const auth = require('../middleware/auth');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { paginationValidation, idParamValidation, bulkIdsValidation } = require('../middleware/validate');

const router = express.Router();

// Get all meal plans (paginated)
router.get('/', auth, paginationValidation, async (req, res) => {
  try {
    const { page, limit, offset, sortBy, sortOrder, search } = getPaginationParams(req.query);
    const where = { userId: req.user.id };
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    const allowedSortFields = ['name', 'created_at', 'startDate', 'targetCalories'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    const { count, rows } = await MealPlan.findAndCountAll({
      where,
      include: [{
        model: MealPlanItem, as: 'items',
        include: [{ model: Recipe, as: 'recipe', include: [{ model: Category, as: 'category' }] }]
      }],
      order: [[orderField, sortOrder]],
      limit, offset,
      distinct: true
    });
    res.json(buildPaginatedResponse(rows, count, page, limit));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single meal plan
router.get('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const mealPlan = await MealPlan.findByPk(req.params.id, {
      include: [{
        model: MealPlanItem, as: 'items',
        include: [{ model: Recipe, as: 'recipe', include: [{ model: Category, as: 'category' }] }]
      }]
    });
    if (!mealPlan) return res.status(404).json({ error: 'Meal plan not found' });
    res.json(mealPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create meal plan
router.post('/', auth, async (req, res) => {
  try {
    const { items, ...mealPlanData } = req.body;
    const mealPlan = await MealPlan.create({ ...mealPlanData, userId: req.user.id });
    if (items && items.length > 0) {
      await MealPlanItem.bulkCreate(items.map(item => ({ ...item, mealPlanId: mealPlan.id })));
    }
    const fullMealPlan = await MealPlan.findByPk(mealPlan.id, {
      include: [{ model: MealPlanItem, as: 'items', include: [{ model: Recipe, as: 'recipe' }] }]
    });
    res.status(201).json(fullMealPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update meal plan
router.put('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const mealPlan = await MealPlan.findByPk(req.params.id);
    if (!mealPlan) return res.status(404).json({ error: 'Meal plan not found' });
    const { items, ...mealPlanData } = req.body;
    await mealPlan.update(mealPlanData);
    if (items) {
      await MealPlanItem.destroy({ where: { mealPlanId: mealPlan.id } });
      if (items.length > 0) {
        await MealPlanItem.bulkCreate(items.map(item => ({ ...item, mealPlanId: mealPlan.id })));
      }
    }
    const updatedMealPlan = await MealPlan.findByPk(mealPlan.id, {
      include: [{ model: MealPlanItem, as: 'items', include: [{ model: Recipe, as: 'recipe' }] }]
    });
    res.json(updatedMealPlan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete meal plan
router.delete('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const mealPlan = await MealPlan.findByPk(req.params.id);
    if (!mealPlan) return res.status(404).json({ error: 'Meal plan not found' });
    await MealPlanItem.destroy({ where: { mealPlanId: mealPlan.id } });
    await mealPlan.destroy();
    res.json({ message: 'Meal plan deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete
router.post('/bulk-delete', auth, bulkIdsValidation, async (req, res) => {
  try {
    const { ids } = req.body;
    await MealPlanItem.destroy({ where: { mealPlanId: ids } });
    const deleted = await MealPlan.destroy({ where: { id: ids, userId: req.user.id } });
    res.json({ message: `${deleted} meal plans deleted`, deleted });
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
    await MealPlan.update(updates, { where: { id: ids, userId: req.user.id } });
    const updated = await MealPlan.findAll({ where: { id: ids, userId: req.user.id } });
    res.json({ message: `${updated.length} meal plans updated`, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
