const express = require('express');
const auth = require('../middleware/auth');
const aiController = require('../controllers/aiController');

const router = express.Router();

// Generate recipe with AI
router.post('/generate-recipe', auth, aiController.generateRecipe);

// Generate meal plan with AI
router.post('/plan-meals', auth, aiController.planMeals);

// Generate grocery list from meal plan
router.post('/generate-grocery-list', auth, aiController.generateGroceryList);

// Analyze nutrition
router.post('/analyze-nutrition', auth, aiController.analyzeNutrition);

// Get recipe suggestions
router.post('/suggest-recipes', auth, aiController.suggestRecipes);

// NEW AI FEATURES

// AI Dietary Adjuster - Adjust recipes for dietary requirements
router.post('/adjust-dietary', auth, aiController.adjustDietary);

// AI Grocery Optimizer - Optimize shopping list for budget
router.post('/optimize-grocery', auth, aiController.optimizeGrocery);

// AI Leftover Suggester - Suggest recipes from leftovers
router.post('/suggest-leftovers', auth, aiController.suggestLeftovers);

// AI Nutrition Balancer - Balance daily nutrition
router.post('/balance-nutrition', auth, aiController.balanceNutrition);

// AI Cooking Timer - Create intelligent cooking schedule
router.post('/create-cooking-timer', auth, aiController.createCookingTimer);

module.exports = router;
