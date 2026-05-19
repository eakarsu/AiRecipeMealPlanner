# Audit Note — AiRecipeMealPlanner

## Original audit recommendations (batch_07.md §11)

**Missing AI endpoints:** `/dietary-restriction-mapper`, `/budget-optimizer`, `/allergen-detection`, `/seasonal-ingredient-suggester`, `/meal-prep-plan`.

**Missing non-AI features:** recipe ratings/reviews, grocery store price integration, barcode/product nutrition DB, meal photo recognition, pantry inventory tracking.

**Custom suggestions:** nutritionist-in-the-loop planning, allergy interview-style profile builder, cost-minimizing planner, cooking-skill-progression, family meal consensus, restaurant menu decoder.

## Implemented this pass (3 mechanical)
1. `POST /api/ai/dietary-restriction-mapper` — converts a restriction to include/exclude ingredient lists, hidden-source pitfalls, label tips. Controller `mapDietaryRestriction`.
2. `POST /api/ai/allergen-detection` — scans a recipe for allergens vs user allergy profile, cross-contamination risks, substitutions. Controller `detectAllergens`.
3. `POST /api/ai/seasonal-ingredient-suggester` — region+month seasonal produce with cost cues and recipe ideas. Controller `seasonalIngredientSuggest`.

All three reuse `callOpenRouter` and the markdown stripping helper, follow controller/router separation. Syntax-checked.

## Backlog (prioritized)
1. `POST /api/ai/budget-optimizer` — cost-minimizing meal planner (mechanical, needs price data assumption).
2. `POST /api/ai/meal-prep-plan` — batch cooking recommendations (mechanical).
3. Recipe ratings/reviews CRUD (mechanical non-AI).
4. Pantry inventory tracking (mechanical non-AI).
5. Barcode/product DB integration (NEEDS-CREDS — Open Food Facts / USDA FoodData).
6. Meal photo recognition (NEEDS-PRODUCT-DECISION — vision model choice).
7. Grocery store price integration (NEEDS-CREDS).

## Apply pass 3 (frontend)

**Action: LEFT-AS-IS.** Frontend fully wired (CRA + Tailwind, axios with bearer-token JWT from `localStorage` via `frontend/src/api/axios.js`).

All 13 backend AI endpoints in `backend/routes/ai.js` are exercised from at least one frontend page:
- `/ai/generate-recipe` → `pages/Recipes.js`
- `/ai/plan-meals` → `pages/MealPlans.js`
- `/ai/generate-grocery-list` → `pages/GroceryLists.js`
- `/ai/analyze-nutrition` → `pages/Nutrition.js`, `pages/NutritionDetail.js`
- `/ai/suggest-recipes`, `/ai/adjust-dietary` → `pages/DietaryProfiles.js`
- `/ai/optimize-grocery` → `pages/GroceryOptimizations.js`
- `/ai/suggest-leftovers` → `pages/LeftoverSuggestions.js`
- `/ai/balance-nutrition` → `pages/NutritionBalances.js`
- `/ai/create-cooking-timer` → `pages/CookingTimers.js`
- `/ai/dietary-restriction-mapper` → `pages/DietaryRestrictionMapper.js`
- `/ai/allergen-detection` → `pages/AllergenDetection.js`
- `/ai/seasonal-ingredient-suggester` → `pages/SeasonalIngredientSuggester.js`

No code changes this pass. See `_AUDIT/apply3_logs/ab3_62.md`.
