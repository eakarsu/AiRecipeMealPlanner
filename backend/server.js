require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const db = require('./models');
const { generalLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.BACKEND_PORT || 5001;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(generalLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/recipes', require('./routes/recipes'));
app.use('/api/meal-plans', require('./routes/mealPlans'));
app.use('/api/grocery-lists', require('./routes/groceryLists'));
app.use('/api/nutrition', require('./routes/nutrition'));
app.use('/api/ingredients', require('./routes/ingredients'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/ai', require('./routes/ai'));

// New AI Feature Routes
app.use('/api/dietary-profiles', require('./routes/dietaryProfiles'));
app.use('/api/grocery-optimizations', require('./routes/groceryOptimizations'));
app.use('/api/leftover-suggestions', require('./routes/leftoverSuggestions'));
app.use('/api/nutrition-balances', require('./routes/nutritionBalances'));
app.use('/api/cooking-timers', require('./routes/cookingTimers'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// AI feature mount: cost-meal-plan
app.use('/api/ai/cost-meal-plan', require('./routes/ai-cost-meal-plan'));
// === Batch 07 Gaps & Frontend Mounts ===
app.use('/api/gap-no-dietaryrestrictionmapper-restrictions-ing', require('./routes/gap-no-dietaryrestrictionmapper-restrictions-ing'));
app.use('/api/gap-no-budgetoptimizer-costaware-nutrition-goals', require('./routes/gap-no-budgetoptimizer-costaware-nutrition-goals'));
app.use('/api/gap-no-allergendetection-crosscontamination-risk', require('./routes/gap-no-allergendetection-crosscontamination-risk'));
app.use('/api/gap-no-seasonalingredientsuggester', require('./routes/gap-no-seasonalingredientsuggester'));
app.use('/api/gap-no-mealprepplan-batch-cooking-recommendation', require('./routes/gap-no-mealprepplan-batch-cooking-recommendation'));
app.use('/api/gap-no-meal-photo-recognition', require('./routes/gap-no-meal-photo-recognition'));
app.use('/api/gap-no-recipe-ratingsreviews-route', require('./routes/gap-no-recipe-ratingsreviews-route'));
app.use('/api/gap-no-grocery-store-price-api-integration', require('./routes/gap-no-grocery-store-price-api-integration'));
app.use('/api/gap-no-barcodeproduct-database-lookup-usda-openf', require('./routes/gap-no-barcodeproduct-database-lookup-usda-openf'));
app.use('/api/gap-no-pantry-inventory-tracking', require('./routes/gap-no-pantry-inventory-tracking'));
app.use('/api/gap-no-sharingsocial-features', require('./routes/gap-no-sharingsocial-features'));
app.use('/api/gap-no-notifications-for-shopping-reminders', require('./routes/gap-no-notifications-for-shopping-reminders'));
// === End Batch 07 ===
