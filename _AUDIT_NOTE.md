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

## Apply pass 6 (close-out)

**Items implemented (mechanical, LLM-only):**
1. `POST /api/ai/meal-prep-plan-spec` — batch cooking recommendations with spec'd snake_case contract. Controller `mealPrepPlanSpec`. Body `{ household_size, days, dietary_restrictions?, kitchen_equipment?, time_budget_per_session_min }`. Returns `{ prep_sessions, total_active_minutes, leftover_strategy }`.
2. `POST /api/ai/budget-optimizer-spec` — cost-minimizing meal planner, LLM-only (caller-supplied price hints; no external grocery API). Controller `budgetOptimizerSpec`. Body `{ weekly_budget_usd, household_size, dietary_restrictions?, location_hint?, current_pantry? }`. Returns `{ meal_plan, total_estimated_cost, savings_tips, shopping_list_with_substitutions, cost_breakdown }`.

**Files modified (append-only):**
- `backend/controllers/aiController.js` — appended `exports.mealPrepPlanSpec`, `exports.budgetOptimizerSpec`.
- `backend/routes/ai.js` — appended two route lines for `-spec` paths.

**Duplicates noted (from prior undocumented work):**
- `exports.budgetOptimizer` (aiController.js L671) and route `POST /api/ai/budget-optimizer` (routes/ai.js L49) — different camelCase body shape (`weeklyBudget`, `householdSize`, `cuisinePreferences`, `regionPriceLevel`) and different return wrapper (`{ budgetPlan }`).
- `exports.mealPrepPlan` (aiController.js L707) and route `POST /api/ai/meal-prep-plan` (routes/ai.js L52) — different camelCase body (`availableHours`, `prepDay`, `mealsPerDay`, `days`, `equipment`) and different return wrapper (`{ prepPlan }`).
- Gap-feature routes also exist: `backend/routes/gap-no-budgetoptimizer-costaware-nutrition-goals.js` (mounted at `/api/gap-no-budgetoptimizer-costaware-nutrition-goals`) and `backend/routes/gap-no-mealprepplan-batch-cooking-recommendation.js` (mounted at `/api/gap-no-mealprepplan-batch-cooking-recommendation`). These are generic LLM passthroughs from a prior batch sweep, kept for compatibility.
- Append-only constraint: existing routes/handlers were NOT modified. Express matches first-registered, so the original handlers continue to serve `/api/ai/budget-optimizer` and `/api/ai/meal-prep-plan`. New spec-compliant handlers are reachable via `-spec`-suffixed paths.

**Syntax check:** `node --check controllers/aiController.js` PASS. `node --check routes/ai.js` PASS.

**Remaining backlog:**
- NEEDS-CREDS: Open Food Facts / USDA FoodData barcode + product nutrition DB lookup.
- NEEDS-CREDS: grocery store price feed integration (live pricing API).
- NEEDS-PRODUCT-DECISION: meal photo recognition — vision model choice (OpenAI gpt-4o-vision vs Anthropic claude-vision vs open-source LLaVA) and storage strategy for uploaded images.
- CRUD-deferred: recipe ratings / reviews — schema decision pending (1-5 stars + text review? per-user uniqueness? aggregate caching?).
- CRUD-deferred: pantry inventory tracking — schema decision pending (qty units, expiration dates, depletion tracking from meal plans).

**Status:** PASS.
