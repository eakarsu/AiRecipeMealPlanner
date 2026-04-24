const express = require('express');
const { Op } = require('sequelize');
const { GroceryList, GroceryItem, Ingredient, MealPlan } = require('../models');
const auth = require('../middleware/auth');
const { getPaginationParams, buildPaginatedResponse } = require('../utils/pagination');
const { paginationValidation, idParamValidation, bulkIdsValidation } = require('../middleware/validate');

const router = express.Router();

// Get all grocery lists (paginated)
router.get('/', auth, paginationValidation, async (req, res) => {
  try {
    const { page, limit, offset, sortBy, sortOrder, search } = getPaginationParams(req.query);
    const where = { userId: req.user.id };
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const allowedSortFields = ['name', 'created_at'];
    const orderField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';

    const { count, rows } = await GroceryList.findAndCountAll({
      where,
      include: [
        { model: GroceryItem, as: 'items', include: [{ model: Ingredient, as: 'ingredient' }] },
        { model: MealPlan, as: 'mealPlan' }
      ],
      order: [[orderField, sortOrder]],
      limit, offset, distinct: true
    });
    res.json(buildPaginatedResponse(rows, count, page, limit));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single grocery list
router.get('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const groceryList = await GroceryList.findByPk(req.params.id, {
      include: [
        { model: GroceryItem, as: 'items', include: [{ model: Ingredient, as: 'ingredient' }] },
        { model: MealPlan, as: 'mealPlan' }
      ]
    });
    if (!groceryList) return res.status(404).json({ error: 'Grocery list not found' });
    res.json(groceryList);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create grocery list
router.post('/', auth, async (req, res) => {
  try {
    const { items, ...listData } = req.body;
    const groceryList = await GroceryList.create({ ...listData, userId: req.user.id });
    if (items && items.length > 0) {
      await GroceryItem.bulkCreate(items.map(item => ({ ...item, groceryListId: groceryList.id })));
    }
    const fullList = await GroceryList.findByPk(groceryList.id, {
      include: [{ model: GroceryItem, as: 'items', include: [{ model: Ingredient, as: 'ingredient' }] }]
    });
    res.status(201).json(fullList);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update grocery list
router.put('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const groceryList = await GroceryList.findByPk(req.params.id);
    if (!groceryList) return res.status(404).json({ error: 'Grocery list not found' });
    const { items, ...listData } = req.body;
    await groceryList.update(listData);
    if (items) {
      await GroceryItem.destroy({ where: { groceryListId: groceryList.id } });
      if (items.length > 0) {
        await GroceryItem.bulkCreate(items.map(item => ({ ...item, groceryListId: groceryList.id })));
      }
    }
    const updatedList = await GroceryList.findByPk(groceryList.id, {
      include: [{ model: GroceryItem, as: 'items', include: [{ model: Ingredient, as: 'ingredient' }] }]
    });
    res.json(updatedList);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Toggle item checked
router.patch('/:id/items/:itemId/toggle', auth, async (req, res) => {
  try {
    const item = await GroceryItem.findByPk(req.params.itemId);
    if (!item) return res.status(404).json({ error: 'Item not found' });
    await item.update({ checked: !item.checked });
    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete grocery list
router.delete('/:id', auth, idParamValidation, async (req, res) => {
  try {
    const groceryList = await GroceryList.findByPk(req.params.id);
    if (!groceryList) return res.status(404).json({ error: 'Grocery list not found' });
    await GroceryItem.destroy({ where: { groceryListId: groceryList.id } });
    await groceryList.destroy();
    res.json({ message: 'Grocery list deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk delete
router.post('/bulk-delete', auth, bulkIdsValidation, async (req, res) => {
  try {
    const { ids } = req.body;
    await GroceryItem.destroy({ where: { groceryListId: ids } });
    const deleted = await GroceryList.destroy({ where: { id: ids, userId: req.user.id } });
    res.json({ message: `${deleted} grocery lists deleted`, deleted });
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
    await GroceryList.update(updates, { where: { id: ids, userId: req.user.id } });
    const updated = await GroceryList.findAll({ where: { id: ids, userId: req.user.id } });
    res.json({ message: `${updated.length} grocery lists updated`, data: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
