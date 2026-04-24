const { Sequelize } = require('sequelize');
require('dotenv').config({ path: '../.env' });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'ai_recipe_meal_planner',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Import models
const User = require('./User')(sequelize);
const Category = require('./Category')(sequelize);
const Ingredient = require('./Ingredient')(sequelize);
const Recipe = require('./Recipe')(sequelize);
const MealPlan = require('./MealPlan')(sequelize);
const MealPlanItem = require('./MealPlanItem')(sequelize);
const GroceryList = require('./GroceryList')(sequelize);
const GroceryItem = require('./GroceryItem')(sequelize);
const NutritionLog = require('./NutritionLog')(sequelize);

// New AI Feature Models
const DietaryProfile = require('./DietaryProfile')(sequelize);
const GroceryOptimization = require('./GroceryOptimization')(sequelize);
const LeftoverSuggestion = require('./LeftoverSuggestion')(sequelize);
const NutritionBalance = require('./NutritionBalance')(sequelize);
const CookingTimer = require('./CookingTimer')(sequelize);

// Define associations
User.hasMany(Recipe, { foreignKey: 'userId', as: 'recipes' });
Recipe.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Category.hasMany(Recipe, { foreignKey: 'categoryId', as: 'recipes' });
Recipe.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

User.hasMany(MealPlan, { foreignKey: 'userId', as: 'mealPlans' });
MealPlan.belongsTo(User, { foreignKey: 'userId', as: 'user' });

MealPlan.hasMany(MealPlanItem, { foreignKey: 'mealPlanId', as: 'items' });
MealPlanItem.belongsTo(MealPlan, { foreignKey: 'mealPlanId', as: 'mealPlan' });

Recipe.hasMany(MealPlanItem, { foreignKey: 'recipeId', as: 'mealPlanItems' });
MealPlanItem.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' });

User.hasMany(GroceryList, { foreignKey: 'userId', as: 'groceryLists' });
GroceryList.belongsTo(User, { foreignKey: 'userId', as: 'user' });

MealPlan.hasMany(GroceryList, { foreignKey: 'mealPlanId', as: 'groceryLists' });
GroceryList.belongsTo(MealPlan, { foreignKey: 'mealPlanId', as: 'mealPlan' });

GroceryList.hasMany(GroceryItem, { foreignKey: 'groceryListId', as: 'items' });
GroceryItem.belongsTo(GroceryList, { foreignKey: 'groceryListId', as: 'groceryList' });

Ingredient.hasMany(GroceryItem, { foreignKey: 'ingredientId', as: 'groceryItems' });
GroceryItem.belongsTo(Ingredient, { foreignKey: 'ingredientId', as: 'ingredient' });

User.hasMany(NutritionLog, { foreignKey: 'userId', as: 'nutritionLogs' });
NutritionLog.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// New associations for AI features
User.hasMany(DietaryProfile, { foreignKey: 'userId', as: 'dietaryProfiles' });
DietaryProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(GroceryOptimization, { foreignKey: 'userId', as: 'groceryOptimizations' });
GroceryOptimization.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(LeftoverSuggestion, { foreignKey: 'userId', as: 'leftoverSuggestions' });
LeftoverSuggestion.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(NutritionBalance, { foreignKey: 'userId', as: 'nutritionBalances' });
NutritionBalance.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(CookingTimer, { foreignKey: 'userId', as: 'cookingTimers' });
CookingTimer.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Recipe.hasMany(CookingTimer, { foreignKey: 'recipeId', as: 'cookingTimers' });
CookingTimer.belongsTo(Recipe, { foreignKey: 'recipeId', as: 'recipe' });

module.exports = {
  sequelize,
  User,
  Category,
  Ingredient,
  Recipe,
  MealPlan,
  MealPlanItem,
  GroceryList,
  GroceryItem,
  NutritionLog,
  DietaryProfile,
  GroceryOptimization,
  LeftoverSuggestion,
  NutritionBalance,
  CookingTimer
};
