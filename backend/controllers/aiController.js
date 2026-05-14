const https = require('https');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Strip markdown code blocks (```json ... ``` or ```...```) from AI responses
function stripMarkdownCodeBlocks(text) {
  if (!text) return text;
  // Remove ```json or ``` wrapper
  let cleaned = text.replace(/```(?:json)?\s*\n?/gi, '');
  return cleaned.trim();
}

async function callOpenRouter(messages, maxTokens = 10000) {
  return new Promise((resolve, reject) => {
    console.log('Calling OpenRouter with model:', OPENROUTER_MODEL);
    console.log('API Key present:', !!OPENROUTER_API_KEY);

    const data = JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      max_tokens: maxTokens
    });

    const options = {
      hostname: 'openrouter.ai',
      path: '/api/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'AI Recipe Meal Planner'
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          console.log('OpenRouter response status:', res.statusCode);
          console.log('OpenRouter response body:', body.substring(0, 500));
          const response = JSON.parse(body);
          if (response.error) {
            reject(new Error(response.error.message || 'OpenRouter API error'));
          } else if (response.choices && response.choices[0]) {
            resolve(stripMarkdownCodeBlocks(response.choices[0].message.content));
          } else {
            reject(new Error('Invalid response from OpenRouter'));
          }
        } catch (e) {
          reject(e);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

exports.generateRecipe = async (req, res) => {
  try {
    const { ingredients, preferences, cuisine, dietaryRestrictions } = req.body;

    const prompt = `Generate a detailed recipe based on the following:
${ingredients ? `Available ingredients: ${ingredients.join(', ')}` : ''}
${preferences ? `Preferences: ${preferences}` : ''}
${cuisine ? `Cuisine type: ${cuisine}` : ''}
${dietaryRestrictions ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}

Please provide the recipe in the following JSON format:
{
  "title": "Recipe Name",
  "description": "Brief description",
  "cuisine": "Cuisine type",
  "prepTime": 15,
  "cookTime": 30,
  "servings": 4,
  "calories": 450,
  "protein": 25,
  "carbs": 35,
  "fat": 18,
  "instructions": "Step by step instructions",
  "ingredients": ["ingredient 1", "ingredient 2"]
}`;

    const response = await callOpenRouter([
      { role: 'system', content: 'You are a professional chef and nutritionist. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const recipe = JSON.parse(jsonMatch[0]);
      res.json({ recipe });
    } else {
      res.json({ recipe: null, rawResponse: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.planMeals = async (req, res) => {
  try {
    const { targetCalories, days = 7, preferences, dietaryRestrictions } = req.body;

    const prompt = `Create a ${days}-day meal plan with a target of ${targetCalories} calories per day.
${preferences ? `Preferences: ${preferences}` : ''}
${dietaryRestrictions ? `Dietary restrictions: ${dietaryRestrictions.join(', ')}` : ''}

Please provide the meal plan in the following JSON format:
{
  "name": "Meal Plan Name",
  "targetCalories": ${targetCalories},
  "days": [
    {
      "day": 0,
      "dayName": "Monday",
      "meals": {
        "breakfast": { "name": "...", "calories": 400, "description": "..." },
        "lunch": { "name": "...", "calories": 500, "description": "..." },
        "dinner": { "name": "...", "calories": 600, "description": "..." },
        "snack": { "name": "...", "calories": 200, "description": "..." }
      },
      "totalCalories": 1700
    }
  ]
}`;

    const response = await callOpenRouter([
      { role: 'system', content: 'You are a professional nutritionist and meal planner. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 10000);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const mealPlan = JSON.parse(jsonMatch[0]);
      res.json({ mealPlan });
    } else {
      res.json({ mealPlan: null, rawResponse: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.generateGroceryList = async (req, res) => {
  try {
    const { mealPlan, servings = 4 } = req.body;

    const prompt = `Generate a comprehensive grocery list for the following meal plan:
${JSON.stringify(mealPlan, null, 2)}

Number of servings: ${servings}

Please provide the grocery list in the following JSON format:
{
  "name": "Grocery List for [Meal Plan Name]",
  "items": [
    { "name": "Item name", "quantity": 2, "unit": "lbs", "category": "Produce" },
    { "name": "Item name", "quantity": 1, "unit": "dozen", "category": "Dairy" }
  ],
  "categories": ["Produce", "Dairy", "Meat", "Pantry", "Frozen"]
}`;

    const response = await callOpenRouter([
      { role: 'system', content: 'You are a helpful meal prep assistant. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const groceryList = JSON.parse(jsonMatch[0]);
      res.json({ groceryList });
    } else {
      res.json({ groceryList: null, rawResponse: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.analyzeNutrition = async (req, res) => {
  try {
    const { foods, goals } = req.body;

    const prompt = `Analyze the nutritional content of the following foods and provide recommendations:
Foods consumed: ${JSON.stringify(foods)}
${goals ? `Goals: ${goals}` : ''}

Please provide the analysis in the following JSON format:
{
  "totalCalories": 1800,
  "totalProtein": 80,
  "totalCarbs": 200,
  "totalFat": 60,
  "analysis": "Detailed analysis of the nutritional intake",
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "macroBreakdown": {
    "proteinPercentage": 18,
    "carbsPercentage": 45,
    "fatPercentage": 30
  }
}`;

    const response = await callOpenRouter([
      { role: 'system', content: 'You are a registered dietitian and nutritionist. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const analysis = JSON.parse(jsonMatch[0]);
      res.json({ analysis });
    } else {
      res.json({ analysis: null, rawResponse: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.suggestRecipes = async (req, res) => {
  try {
    const { ingredients, mealType, cuisine, maxPrepTime } = req.body;

    const prompt = `Suggest 5 recipes based on the following criteria:
${ingredients ? `Available ingredients: ${ingredients.join(', ')}` : ''}
${mealType ? `Meal type: ${mealType}` : ''}
${cuisine ? `Preferred cuisine: ${cuisine}` : ''}
${maxPrepTime ? `Maximum prep time: ${maxPrepTime} minutes` : ''}

Please provide the suggestions in the following JSON format:
{
  "suggestions": [
    {
      "title": "Recipe Name",
      "description": "Brief description",
      "prepTime": 20,
      "difficulty": "easy",
      "matchScore": 95
    }
  ]
}`;

    const response = await callOpenRouter([
      { role: 'system', content: 'You are a creative chef with expertise in various cuisines. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ]);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      res.json(suggestions);
    } else {
      res.json({ suggestions: [], rawResponse: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// NEW AI FEATURES

// AI Dietary Adjuster - Adjusts recipes based on dietary requirements
exports.adjustDietary = async (req, res) => {
  try {
    const { recipe, restrictions, allergies, preferences, targetCalories } = req.body;

    const prompt = `Adjust the following recipe to meet these dietary requirements:

Original Recipe:
${JSON.stringify(recipe, null, 2)}

Requirements:
- Dietary Restrictions: ${restrictions ? restrictions.join(', ') : 'None'}
- Allergies: ${allergies ? allergies.join(', ') : 'None'}
- Preferences: ${preferences || 'None'}
- Target Calories: ${targetCalories || 'No specific target'}

Please provide the adjusted recipe in the following JSON format:
{
  "originalTitle": "Original recipe name",
  "adjustedTitle": "Adjusted recipe name",
  "adjustedDescription": "Brief description of adjusted recipe",
  "changes": [
    { "original": "original ingredient", "replacement": "new ingredient", "reason": "why changed" }
  ],
  "adjustedIngredients": ["ingredient 1", "ingredient 2"],
  "adjustedInstructions": "Step by step instructions",
  "nutritionComparison": {
    "original": { "calories": 500, "protein": 30, "carbs": 40, "fat": 25 },
    "adjusted": { "calories": 400, "protein": 35, "carbs": 30, "fat": 15 }
  },
  "dietaryNotes": "Notes about how the recipe now meets dietary requirements",
  "tips": ["Tip 1 for best results", "Tip 2"]
}`;

    const response = await callOpenRouter([
      { role: 'system', content: 'You are an expert nutritionist and chef specializing in dietary adaptations. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 10000);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const adjustedRecipe = JSON.parse(jsonMatch[0]);
      res.json({ adjustedRecipe });
    } else {
      res.json({ adjustedRecipe: null, rawResponse: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI Grocery Optimizer - Optimizes shopping list for budget and efficiency
exports.optimizeGrocery = async (req, res) => {
  try {
    const { items, budget, storePreference, prioritizeFresh, familySize } = req.body;

    const prompt = `Optimize this grocery shopping list for budget and efficiency:

Shopping List Items:
${JSON.stringify(items, null, 2)}

Constraints:
- Budget: $${budget || 'No specific budget'}
- Store Preference: ${storePreference || 'Any'}
- Prioritize Fresh Produce: ${prioritizeFresh ? 'Yes' : 'No'}
- Family Size: ${familySize || '4'} people

Please provide the optimized list in the following JSON format:
{
  "summary": "Brief summary of optimizations made",
  "originalEstimate": 150.00,
  "optimizedEstimate": 120.00,
  "savings": 30.00,
  "savingsPercentage": 20,
  "optimizedItems": [
    {
      "name": "Item name",
      "quantity": 2,
      "unit": "lbs",
      "estimatedPrice": 5.99,
      "category": "Produce",
      "tip": "Buy in season for best price"
    }
  ],
  "substitutions": [
    {
      "original": "expensive item",
      "substitute": "budget alternative",
      "savings": 3.00,
      "nutritionImpact": "Similar nutritional value"
    }
  ],
  "shoppingTips": [
    "Tip 1 for saving money",
    "Tip 2 for meal prep efficiency"
  ],
  "mealPrepSuggestions": [
    "Suggestion 1 for using items efficiently"
  ]
}`;

    const response = await callOpenRouter([
      { role: 'system', content: 'You are a budget-savvy meal planning expert. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 10000);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const optimization = JSON.parse(jsonMatch[0]);
      res.json({ optimization });
    } else {
      res.json({ optimization: null, rawResponse: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI Leftover Suggester - Suggests recipes from leftovers
exports.suggestLeftovers = async (req, res) => {
  try {
    const { leftovers, expirationPriority, mealType, servings } = req.body;

    const prompt = `Suggest creative recipes using these leftover ingredients:

Available Leftovers:
${leftovers.map(l => `- ${l.name}${l.quantity ? ` (${l.quantity})` : ''}${l.expiresIn ? ` - expires in ${l.expiresIn}` : ''}`).join('\n')}

Requirements:
- Prioritize expiring items: ${expirationPriority ? 'Yes' : 'No'}
- Meal Type: ${mealType || 'Any'}
- Servings needed: ${servings || '2-4'}

Please provide recipe suggestions in the following JSON format:
{
  "urgentItems": ["Items that should be used first due to expiration"],
  "suggestions": [
    {
      "title": "Recipe Name",
      "description": "Brief description",
      "usesLeftovers": ["leftover 1", "leftover 2"],
      "additionalIngredients": ["any items needed from store"],
      "prepTime": 20,
      "cookTime": 30,
      "difficulty": "easy",
      "instructions": "Step by step instructions",
      "tips": "Tips for best results",
      "storageInfo": "How to store leftovers of this dish"
    }
  ],
  "wasteReductionTips": [
    "Tip 1 for reducing food waste",
    "Tip 2 for storing ingredients"
  ],
  "freezingOptions": [
    "Items that can be frozen for later use"
  ]
}`;

    const response = await callOpenRouter([
      { role: 'system', content: 'You are a creative chef focused on reducing food waste. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 10000);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const suggestions = JSON.parse(jsonMatch[0]);
      res.json({ suggestions });
    } else {
      res.json({ suggestions: null, rawResponse: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI Nutrition Balancer - Analyzes and balances daily nutrition
exports.balanceNutrition = async (req, res) => {
  try {
    const { currentIntake, goals, dietType, activityLevel } = req.body;

    const prompt = `Analyze and balance this daily nutritional intake:

Current Intake:
${JSON.stringify(currentIntake, null, 2)}

Goals:
- Diet Type: ${dietType || 'Balanced'}
- Activity Level: ${activityLevel || 'Moderate'}
- Specific Goals: ${goals || 'General health'}

Please provide a detailed analysis in the following JSON format:
{
  "overallScore": 75,
  "scoreDescription": "Good, but room for improvement",
  "currentTotals": {
    "calories": 1800,
    "protein": 65,
    "carbs": 220,
    "fat": 70,
    "fiber": 18,
    "sugar": 45,
    "sodium": 2200
  },
  "recommendedTotals": {
    "calories": 2000,
    "protein": 80,
    "carbs": 250,
    "fat": 65,
    "fiber": 25,
    "sugar": 30,
    "sodium": 2000
  },
  "deficiencies": [
    { "nutrient": "Protein", "current": 65, "recommended": 80, "gap": 15, "importance": "high" }
  ],
  "excesses": [
    { "nutrient": "Sugar", "current": 45, "recommended": 30, "excess": 15, "concern": "moderate" }
  ],
  "mealSuggestions": [
    {
      "meal": "Dinner",
      "suggestion": "Add grilled chicken breast",
      "reason": "To meet protein goals",
      "nutritionBoost": { "protein": 30, "calories": 165 }
    }
  ],
  "snackRecommendations": [
    {
      "name": "Greek yogurt with berries",
      "benefits": "High protein, low sugar",
      "nutrition": { "protein": 15, "carbs": 20, "fat": 5 }
    }
  ],
  "weeklyTips": [
    "Tip 1 for maintaining balanced nutrition",
    "Tip 2 for meal prep"
  ]
}`;

    const response = await callOpenRouter([
      { role: 'system', content: 'You are a registered dietitian specializing in balanced nutrition. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 10000);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const balance = JSON.parse(jsonMatch[0]);
      res.json({ balance });
    } else {
      res.json({ balance: null, rawResponse: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI Cooking Timer - Creates intelligent cooking schedules
exports.createCookingTimer = async (req, res) => {
  try {
    const { recipe, servings, startTime, skillLevel } = req.body;

    const prompt = `Create an intelligent cooking schedule for this recipe:

Recipe:
${JSON.stringify(recipe, null, 2)}

Requirements:
- Servings: ${servings || recipe.servings || 4}
- Desired Start Time: ${startTime || 'Now'}
- Cook's Skill Level: ${skillLevel || 'Intermediate'}

Please provide a detailed cooking schedule in the following JSON format:
{
  "recipeName": "Recipe name",
  "totalTime": 45,
  "servings": 4,
  "steps": [
    {
      "stepNumber": 1,
      "title": "Prep vegetables",
      "description": "Detailed description of what to do",
      "duration": 10,
      "type": "prep",
      "tips": "Tips for this step",
      "canMultitask": true,
      "multitaskSuggestion": "While this is happening, you can..."
    },
    {
      "stepNumber": 2,
      "title": "Heat pan",
      "description": "Heat olive oil in a large pan over medium-high heat",
      "duration": 2,
      "type": "active",
      "temperature": "medium-high",
      "tips": "Pan is ready when oil shimmers",
      "canMultitask": false
    }
  ],
  "timeline": [
    { "time": "0:00", "action": "Start prep" },
    { "time": "0:10", "action": "Begin cooking" }
  ],
  "equipmentNeeded": [
    { "item": "Large skillet", "size": "12 inch" }
  ],
  "prepAheadTips": [
    "Things you can prepare in advance"
  ],
  "timingTips": [
    "Tips for perfect timing",
    "What to watch for"
  ],
  "servingTemperature": "Serve immediately while hot",
  "restingTime": "Let rest 5 minutes before serving"
}`;

    const response = await callOpenRouter([
      { role: 'system', content: 'You are an expert chef and cooking instructor. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 10000);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const timer = JSON.parse(jsonMatch[0]);
      res.json({ timer });
    } else {
      res.json({ timer: null, rawResponse: response });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI Dietary Restriction Mapper - convert restrictions to ingredient include/exclude lists
exports.mapDietaryRestriction = async (req, res) => {
  try {
    const { restrictions, cuisine } = req.body;
    const prompt = `Map the following dietary restriction(s) to concrete include/exclude ingredient lists, hidden-source pitfalls, and label-reading tips.

Restrictions: ${Array.isArray(restrictions) ? restrictions.join(', ') : (restrictions || '')}
Cuisine context: ${cuisine || 'general'}

Return JSON:
{
  "exclude_ingredients": [],
  "exclude_ingredient_categories": [],
  "include_safe_alternatives": [{"replaces": "", "alternative": ""}],
  "hidden_sources_to_watch": [],
  "label_reading_tips": [],
  "cross_contamination_risks": [],
  "summary": ""
}`;
    const response = await callOpenRouter([
      { role: 'system', content: 'You are a registered dietitian. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 4000);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return res.json({ mapping: JSON.parse(jsonMatch[0]) });
    return res.json({ mapping: null, rawResponse: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI Allergen Detection - scan a recipe for cross-contamination/allergen risk
exports.detectAllergens = async (req, res) => {
  try {
    const { recipe, allergyProfile } = req.body;
    const recipeText = typeof recipe === 'string' ? recipe : JSON.stringify(recipe || {});
    const prompt = `Scan this recipe for allergens and cross-contamination risk.

Recipe:
${recipeText}

User Allergy Profile: ${Array.isArray(allergyProfile) ? allergyProfile.join(', ') : (allergyProfile || 'none specified')}

Return JSON:
{
  "detected_allergens": [{"allergen": "", "ingredient": "", "severity": "low|moderate|high"}],
  "cross_contamination_risks": [{"step": "", "risk": "", "mitigation": ""}],
  "safe_for_user": true,
  "user_specific_warnings": [],
  "label_check_required": [],
  "substitution_suggestions": [{"ingredient": "", "alternative": ""}],
  "summary": ""
}`;
    const response = await callOpenRouter([
      { role: 'system', content: 'You are a food-safety AI specialized in allergen detection. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 4000);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return res.json({ allergenReport: JSON.parse(jsonMatch[0]) });
    return res.json({ allergenReport: null, rawResponse: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// AI Seasonal Ingredient Suggester
exports.budgetOptimizer = async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI not configured' });
    }
    const { weeklyBudget, householdSize, dietaryRestrictions, cuisinePreferences, regionPriceLevel } = req.body;
    const prompt = `Build a cost-minimizing weekly meal plan that meets all preferences.

Weekly budget (USD): ${weeklyBudget || 100}
Household size: ${householdSize || 2}
Dietary restrictions: ${Array.isArray(dietaryRestrictions) ? dietaryRestrictions.join(', ') : 'none'}
Cuisine preferences: ${Array.isArray(cuisinePreferences) ? cuisinePreferences.join(', ') : 'none'}
Region price level (low|average|high): ${regionPriceLevel || 'average'}

Return JSON:
{
  "summary": "",
  "estimated_total_cost_usd": 0,
  "savings_strategies": [],
  "meal_plan": [{ "day": "", "breakfast": "", "lunch": "", "dinner": "", "estimated_day_cost_usd": 0 }],
  "shopping_list": [{ "ingredient": "", "qty": "", "estimated_cost_usd": 0, "store_tier": "discount|standard|premium" }],
  "bulk_buy_recommendations": [],
  "swap_suggestions": [{ "expensive_item": "", "cheaper_alternative": "", "savings_usd": 0 }]
}`;
    const response = await callOpenRouter([
      { role: 'system', content: 'You are a cost-conscious culinary AI. Optimise for low cost without sacrificing nutrition. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 6000);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return res.json({ budgetPlan: JSON.parse(jsonMatch[0]) });
    return res.json({ budgetPlan: null, rawResponse: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.mealPrepPlan = async (req, res) => {
  try {
    if (!OPENROUTER_API_KEY) {
      return res.status(503).json({ error: 'AI not configured' });
    }
    const { availableHours, prepDay, mealsPerDay, days, dietaryRestrictions, equipment } = req.body;
    const prompt = `Design a batch-cooking meal-prep plan that minimises active cooking time across the week.

Available prep hours: ${availableHours || 3}
Prep day: ${prepDay || 'Sunday'}
Meals per day: ${mealsPerDay || 3}
Days covered: ${days || 5}
Dietary restrictions: ${Array.isArray(dietaryRestrictions) ? dietaryRestrictions.join(', ') : 'none'}
Equipment: ${Array.isArray(equipment) ? equipment.join(', ') : 'standard kitchen'}

Return JSON:
{
  "summary": "",
  "prep_session_minutes": 0,
  "stages": [{ "step": 0, "task": "", "duration_min": 0, "parallel_with_step": null }],
  "batch_recipes": [{ "name": "", "yields_servings": 0, "components": [], "storage": { "fridge_days": 0, "freezer_days": 0 }, "reheat_instructions": "" }],
  "daily_assembly": [{ "day": "", "breakfast": "", "lunch": "", "dinner": "" }],
  "containers_needed": [],
  "tips": []
}`;
    const response = await callOpenRouter([
      { role: 'system', content: 'You are a meal-prep specialist AI. Optimise for batch efficiency and food safety. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 6000);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return res.json({ prepPlan: JSON.parse(jsonMatch[0]) });
    return res.json({ prepPlan: null, rawResponse: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.seasonalIngredientSuggest = async (req, res) => {
  try {
    const { region, month, mealType, dietaryRestrictions } = req.body;
    const now = new Date();
    const monthName = month || now.toLocaleString('default', { month: 'long' });
    const prompt = `Suggest seasonal, locally available ingredients optimized for the time and region given.

Region: ${region || 'Northern Hemisphere temperate'}
Month: ${monthName}
Meal type: ${mealType || 'any'}
Dietary restrictions: ${Array.isArray(dietaryRestrictions) ? dietaryRestrictions.join(', ') : 'none'}

Return JSON:
{
  "in_season": [{"ingredient": "", "category": "vegetable|fruit|grain|protein|herb", "peak_freshness": "", "typical_cost": "low|medium|high"}],
  "fading_out": [],
  "coming_soon": [],
  "recipe_ideas": [{"name": "", "key_seasonal_ingredients": []}],
  "shopping_tips": [],
  "preservation_tips": []
}`;
    const response = await callOpenRouter([
      { role: 'system', content: 'You are a culinary AI with deep regional/seasonal produce knowledge. Always respond with valid JSON.' },
      { role: 'user', content: prompt }
    ], 4000);
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) return res.json({ seasonal: JSON.parse(jsonMatch[0]) });
    return res.json({ seasonal: null, rawResponse: response });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
