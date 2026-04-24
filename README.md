# AI Recipe Meal Planner

A professional full-stack meal planning application with AI-powered features using OpenRouter, PostgreSQL database, React frontend, and Node.js/Express backend.

## Features

- **Authentication**: JWT-based login with demo credentials auto-fill
- **Recipes**: Browse, create, and AI-generate recipes (15+ seeded)
- **Meal Plans**: Weekly meal planning with calorie tracking (15+ seeded)
- **Grocery Lists**: Shopping lists linked to meal plans (15+ seeded)
- **Nutrition Tracker**: Daily nutrition logging with macros breakdown (15+ seeded)
- **Ingredients**: Ingredient database with nutrition info (20+ seeded)
- **Categories**: Recipe categorization system (15+ seeded)
- **AI Integration**: OpenRouter-powered recipe generation, meal planning, and nutrition analysis

## Tech Stack

- **Frontend**: React 18, React Router, Tailwind CSS
- **Backend**: Node.js, Express, Sequelize ORM
- **Database**: PostgreSQL
- **AI**: OpenRouter API

## Quick Start

1. **Configure environment variables**:
   ```bash
   # Edit .env file with your settings
   ```

2. **Add your OpenRouter API key** to `.env`:
   ```
   OPENROUTER_API_KEY=your-api-key-here
   ```

3. **Start the application**:
   ```bash
   ./start.sh
   ```

4. **Access the app**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

5. **Demo credentials**:
   - Email: demo@example.com
   - Password: demo123

## Project Structure

```
AiRecipeMealPlanner/
├── .env                    # Environment variables
├── start.sh               # Start script
├── backend/
│   ├── server.js          # Express server
│   ├── config/            # Database configuration
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Auth middleware
│   └── seeders/           # Database seeders
└── frontend/
    ├── src/
    │   ├── components/    # Reusable components
    │   ├── pages/         # Page components
    │   ├── context/       # React context
    │   └── api/           # API client
    └── tailwind.config.js
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register
- `GET /api/auth/me` - Get current user

### Recipes
- `GET /api/recipes` - List recipes
- `GET /api/recipes/:id` - Get recipe
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Meal Plans
- `GET /api/meal-plans` - List meal plans
- `GET /api/meal-plans/:id` - Get meal plan with items
- `POST /api/meal-plans` - Create meal plan
- `DELETE /api/meal-plans/:id` - Delete meal plan

### Grocery Lists
- `GET /api/grocery-lists` - List grocery lists
- `GET /api/grocery-lists/:id` - Get grocery list with items
- `POST /api/grocery-lists` - Create grocery list
- `PATCH /api/grocery-lists/:id/items/:itemId/toggle` - Toggle item checked

### Nutrition
- `GET /api/nutrition` - List nutrition logs
- `GET /api/nutrition/:id` - Get nutrition log
- `POST /api/nutrition` - Create nutrition log

### Ingredients & Categories
- `GET /api/ingredients` - List ingredients
- `GET /api/categories` - List categories

### AI Endpoints
- `POST /api/ai/generate-recipe` - Generate recipe with AI
- `POST /api/ai/plan-meals` - Generate meal plan with AI
- `POST /api/ai/generate-grocery-list` - Generate grocery list
- `POST /api/ai/analyze-nutrition` - Analyze nutrition
- `POST /api/ai/suggest-recipes` - Get recipe suggestions

## License

MIT
