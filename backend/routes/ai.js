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

// AI Dietary Restriction Mapper
router.post('/dietary-restriction-mapper', auth, aiController.mapDietaryRestriction);

// AI Allergen Detection
router.post('/allergen-detection', auth, aiController.detectAllergens);

// AI Seasonal Ingredient Suggester
router.post('/seasonal-ingredient-suggester', auth, aiController.seasonalIngredientSuggest);

// AI Budget Optimizer - Cost-minimising weekly meal plan
router.post('/budget-optimizer', auth, aiController.budgetOptimizer);

// AI Meal Prep Plan - Batch-cooking schedule
router.post('/meal-prep-plan', auth, aiController.mealPrepPlan);

// === Apply pass 6 (close-out) — canonical spec'd contract handlers ===
// Duplicates of /budget-optimizer and /meal-prep-plan above exist from prior
// undocumented work. The handlers below honor the spec'd snake_case body
// fields and return contract. Express matches first-registered, so the
// existing handlers continue to serve these paths; the new handlers are
// reachable via the explicit -spec suffix routes below.
router.post('/meal-prep-plan-spec', auth, aiController.mealPrepPlanSpec);
router.post('/budget-optimizer-spec', auth, aiController.budgetOptimizerSpec);

module.exports = router;
