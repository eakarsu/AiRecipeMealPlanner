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
