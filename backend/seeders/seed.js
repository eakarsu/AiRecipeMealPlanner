const {
  User, Category, Ingredient, Recipe, MealPlan, MealPlanItem,
  GroceryList, GroceryItem, NutritionLog,
  DietaryProfile, GroceryOptimization, LeftoverSuggestion, NutritionBalance, CookingTimer
} = require('../models');

if (process.env.NODE_ENV === 'production' || process.env.ALLOW_DEMO_SEED !== 'true') throw new Error('Demo seed is disabled outside an explicitly approved non-production database.');
const demoEmail = String(process.env.DEMO_EMAIL || '').trim().toLowerCase();
const demoPassword = String(process.env.DEMO_PASSWORD || '');
if (!demoEmail || demoPassword.length < 12) throw new Error('DEMO_EMAIL and a 12+ character DEMO_PASSWORD are required.');

async function seed() {
  console.log('Seeding database...');

  // Create demo user
  const user = await User.create({
    email: demoEmail,
    password: demoPassword,
    name: 'Demo User'
  });

  console.log('Created demo user');

  // Create categories (15+)
  const categories = await Category.bulkCreate([
    { name: 'Breakfast', description: 'Morning meals to start your day', icon: 'sunrise' },
    { name: 'Lunch', description: 'Midday meals', icon: 'sun' },
    { name: 'Dinner', description: 'Evening meals', icon: 'moon' },
    { name: 'Snacks', description: 'Light bites between meals', icon: 'cookie' },
    { name: 'Desserts', description: 'Sweet treats', icon: 'cake' },
    { name: 'Appetizers', description: 'Starters and small plates', icon: 'plate' },
    { name: 'Soups', description: 'Warm and comforting soups', icon: 'bowl' },
    { name: 'Salads', description: 'Fresh and healthy salads', icon: 'leaf' },
    { name: 'Vegetarian', description: 'Meat-free dishes', icon: 'carrot' },
    { name: 'Vegan', description: 'Plant-based dishes', icon: 'seedling' },
    { name: 'Seafood', description: 'Fish and shellfish dishes', icon: 'fish' },
    { name: 'Meat', description: 'Beef, pork, and lamb dishes', icon: 'drumstick' },
    { name: 'Poultry', description: 'Chicken and turkey dishes', icon: 'turkey' },
    { name: 'Pasta', description: 'Italian pasta dishes', icon: 'utensils' },
    { name: 'Asian', description: 'Asian-inspired dishes', icon: 'chopsticks' },
    { name: 'Mexican', description: 'Mexican and Tex-Mex dishes', icon: 'pepper' }
  ]);

  console.log('Created categories');

  // Create ingredients (20+)
  const ingredients = await Ingredient.bulkCreate([
    { name: 'Chicken Breast', caloriesPer100g: 165, protein: 31, carbs: 0, fat: 3.6, category: 'Meat' },
    { name: 'Salmon Fillet', caloriesPer100g: 208, protein: 20, carbs: 0, fat: 13, category: 'Seafood' },
    { name: 'Brown Rice', caloriesPer100g: 112, protein: 2.6, carbs: 24, fat: 0.9, category: 'Grains' },
    { name: 'Quinoa', caloriesPer100g: 120, protein: 4.4, carbs: 21, fat: 1.9, category: 'Grains' },
    { name: 'Broccoli', caloriesPer100g: 34, protein: 2.8, carbs: 7, fat: 0.4, category: 'Vegetables' },
    { name: 'Spinach', caloriesPer100g: 23, protein: 2.9, carbs: 3.6, fat: 0.4, category: 'Vegetables' },
    { name: 'Sweet Potato', caloriesPer100g: 86, protein: 1.6, carbs: 20, fat: 0.1, category: 'Vegetables' },
    { name: 'Avocado', caloriesPer100g: 160, protein: 2, carbs: 9, fat: 15, category: 'Fruits' },
    { name: 'Eggs', caloriesPer100g: 155, protein: 13, carbs: 1.1, fat: 11, category: 'Dairy' },
    { name: 'Greek Yogurt', caloriesPer100g: 59, protein: 10, carbs: 3.6, fat: 0.7, category: 'Dairy' },
    { name: 'Olive Oil', caloriesPer100g: 884, protein: 0, carbs: 0, fat: 100, category: 'Oils' },
    { name: 'Almonds', caloriesPer100g: 579, protein: 21, carbs: 22, fat: 50, category: 'Nuts' },
    { name: 'Black Beans', caloriesPer100g: 132, protein: 8.9, carbs: 24, fat: 0.5, category: 'Legumes' },
    { name: 'Tofu', caloriesPer100g: 76, protein: 8, carbs: 1.9, fat: 4.8, category: 'Protein' },
    { name: 'Oats', caloriesPer100g: 389, protein: 17, carbs: 66, fat: 7, category: 'Grains' },
    { name: 'Banana', caloriesPer100g: 89, protein: 1.1, carbs: 23, fat: 0.3, category: 'Fruits' },
    { name: 'Blueberries', caloriesPer100g: 57, protein: 0.7, carbs: 14, fat: 0.3, category: 'Fruits' },
    { name: 'Garlic', caloriesPer100g: 149, protein: 6.4, carbs: 33, fat: 0.5, category: 'Vegetables' },
    { name: 'Onion', caloriesPer100g: 40, protein: 1.1, carbs: 9, fat: 0.1, category: 'Vegetables' },
    { name: 'Tomatoes', caloriesPer100g: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: 'Vegetables' },
    { name: 'Bell Pepper', caloriesPer100g: 31, protein: 1, carbs: 6, fat: 0.3, category: 'Vegetables' },
    { name: 'Lemon', caloriesPer100g: 29, protein: 1.1, carbs: 9, fat: 0.3, category: 'Fruits' }
  ]);

  console.log('Created ingredients');

  // Create recipes (15+)
  const recipes = await Recipe.bulkCreate([
    {
      userId: user.id,
      title: 'Grilled Chicken Salad',
      description: 'Fresh and healthy grilled chicken salad with mixed greens',
      instructions: '1. Season chicken breast with salt and pepper\n2. Grill chicken for 6-7 minutes per side\n3. Let rest and slice\n4. Arrange mixed greens on plate\n5. Top with sliced chicken, tomatoes, and avocado\n6. Drizzle with olive oil and lemon juice',
      prepTime: 15,
      cookTime: 15,
      servings: 2,
      calories: 450,
      protein: 35,
      carbs: 15,
      fat: 28,
      imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
      cuisine: 'American',
      categoryId: categories[7].id
    },
    {
      userId: user.id,
      title: 'Salmon with Quinoa',
      description: 'Pan-seared salmon served over fluffy quinoa with vegetables',
      instructions: '1. Cook quinoa according to package directions\n2. Season salmon with herbs and lemon\n3. Pan-sear salmon for 4 minutes per side\n4. Steam broccoli until tender\n5. Serve salmon over quinoa with broccoli',
      prepTime: 10,
      cookTime: 25,
      servings: 2,
      calories: 520,
      protein: 42,
      carbs: 35,
      fat: 22,
      imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288',
      cuisine: 'Mediterranean',
      categoryId: categories[10].id
    },
    {
      userId: user.id,
      title: 'Overnight Oats',
      description: 'Creamy overnight oats with fresh berries and almonds',
      instructions: '1. Combine oats, Greek yogurt, and milk in a jar\n2. Add honey to taste\n3. Refrigerate overnight\n4. Top with blueberries and sliced almonds\n5. Enjoy cold or warm up slightly',
      prepTime: 5,
      cookTime: 0,
      servings: 1,
      calories: 380,
      protein: 18,
      carbs: 52,
      fat: 12,
      imageUrl: 'https://images.unsplash.com/photo-1517673400267-0251440c45dc',
      cuisine: 'American',
      categoryId: categories[0].id
    },
    {
      userId: user.id,
      title: 'Vegetable Stir Fry',
      description: 'Colorful vegetable stir fry with tofu and brown rice',
      instructions: '1. Press and cube tofu\n2. Cook brown rice\n3. Stir fry tofu until golden\n4. Add vegetables and sauce\n5. Serve over rice',
      prepTime: 20,
      cookTime: 20,
      servings: 4,
      calories: 320,
      protein: 14,
      carbs: 42,
      fat: 10,
      imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19',
      cuisine: 'Asian',
      categoryId: categories[8].id
    },
    {
      userId: user.id,
      title: 'Avocado Toast',
      description: 'Classic avocado toast with poached eggs',
      instructions: '1. Toast bread until golden\n2. Mash avocado with lemon juice and salt\n3. Poach eggs\n4. Spread avocado on toast\n5. Top with poached eggs\n6. Season with pepper and red pepper flakes',
      prepTime: 10,
      cookTime: 5,
      servings: 2,
      calories: 350,
      protein: 14,
      carbs: 28,
      fat: 22,
      imageUrl: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d',
      cuisine: 'American',
      categoryId: categories[0].id
    },
    {
      userId: user.id,
      title: 'Greek Chicken Bowl',
      description: 'Mediterranean chicken bowl with hummus and feta',
      instructions: '1. Marinate chicken in Greek spices\n2. Grill or pan-sear chicken\n3. Prepare quinoa\n4. Chop vegetables\n5. Assemble bowl with hummus, feta, and olives',
      prepTime: 15,
      cookTime: 20,
      servings: 2,
      calories: 480,
      protein: 38,
      carbs: 32,
      fat: 24,
      imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe',
      cuisine: 'Mediterranean',
      categoryId: categories[1].id
    },
    {
      userId: user.id,
      title: 'Black Bean Tacos',
      description: 'Spicy black bean tacos with fresh salsa',
      instructions: '1. Season and heat black beans\n2. Warm tortillas\n3. Prepare fresh pico de gallo\n4. Assemble tacos with beans, lettuce, and salsa\n5. Top with sour cream and cheese',
      prepTime: 15,
      cookTime: 10,
      servings: 4,
      calories: 380,
      protein: 12,
      carbs: 48,
      fat: 16,
      imageUrl: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b',
      cuisine: 'Mexican',
      categoryId: categories[15].id
    },
    {
      userId: user.id,
      title: 'Chicken Noodle Soup',
      description: 'Comforting homemade chicken noodle soup',
      instructions: '1. Sauté onions, carrots, and celery\n2. Add chicken broth and chicken\n3. Simmer until chicken is cooked\n4. Add egg noodles\n5. Season with herbs and serve hot',
      prepTime: 15,
      cookTime: 45,
      servings: 6,
      calories: 280,
      protein: 22,
      carbs: 28,
      fat: 8,
      imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd',
      cuisine: 'American',
      categoryId: categories[6].id
    },
    {
      userId: user.id,
      title: 'Spaghetti Carbonara',
      description: 'Classic Italian pasta with creamy egg sauce and pancetta',
      instructions: '1. Cook spaghetti al dente\n2. Fry pancetta until crispy\n3. Mix eggs with Parmesan\n4. Toss hot pasta with pancetta\n5. Add egg mixture off heat\n6. Serve immediately with extra cheese',
      prepTime: 10,
      cookTime: 20,
      servings: 4,
      calories: 550,
      protein: 24,
      carbs: 58,
      fat: 26,
      imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3',
      cuisine: 'Italian',
      categoryId: categories[13].id
    },
    {
      userId: user.id,
      title: 'Sweet Potato Buddha Bowl',
      description: 'Nourishing bowl with roasted sweet potato and tahini dressing',
      instructions: '1. Roast cubed sweet potato\n2. Cook quinoa\n3. Prepare chickpeas\n4. Make tahini dressing\n5. Assemble bowl with greens and vegetables',
      prepTime: 15,
      cookTime: 35,
      servings: 2,
      calories: 420,
      protein: 14,
      carbs: 56,
      fat: 18,
      imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
      cuisine: 'American',
      categoryId: categories[9].id
    },
    {
      userId: user.id,
      title: 'Shrimp Pad Thai',
      description: 'Authentic Thai noodles with shrimp and peanuts',
      instructions: '1. Soak rice noodles\n2. Make pad thai sauce\n3. Stir fry shrimp\n4. Add noodles and sauce\n5. Top with peanuts, lime, and green onions',
      prepTime: 20,
      cookTime: 15,
      servings: 4,
      calories: 480,
      protein: 28,
      carbs: 52,
      fat: 18,
      imageUrl: 'https://images.unsplash.com/photo-1559314809-0d155014e29e',
      cuisine: 'Thai',
      categoryId: categories[14].id
    },
    {
      userId: user.id,
      title: 'Beef Stir Fry',
      description: 'Quick beef stir fry with colorful vegetables',
      instructions: '1. Slice beef thinly\n2. Marinate in soy sauce\n3. Stir fry beef on high heat\n4. Add vegetables\n5. Finish with sauce and serve over rice',
      prepTime: 20,
      cookTime: 10,
      servings: 4,
      calories: 380,
      protein: 32,
      carbs: 22,
      fat: 18,
      imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b',
      cuisine: 'Asian',
      categoryId: categories[11].id
    },
    {
      userId: user.id,
      title: 'Caprese Salad',
      description: 'Fresh tomatoes with mozzarella and basil',
      instructions: '1. Slice fresh tomatoes\n2. Slice fresh mozzarella\n3. Arrange alternating on plate\n4. Add fresh basil leaves\n5. Drizzle with olive oil and balsamic',
      prepTime: 10,
      cookTime: 0,
      servings: 2,
      calories: 280,
      protein: 14,
      carbs: 8,
      fat: 22,
      imageUrl: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804',
      cuisine: 'Italian',
      categoryId: categories[5].id
    },
    {
      userId: user.id,
      title: 'Chocolate Chip Cookies',
      description: 'Classic homemade chocolate chip cookies',
      instructions: '1. Cream butter and sugars\n2. Add eggs and vanilla\n3. Mix in flour and baking soda\n4. Fold in chocolate chips\n5. Bake at 375°F for 10-12 minutes',
      prepTime: 15,
      cookTime: 12,
      servings: 24,
      calories: 150,
      protein: 2,
      carbs: 20,
      fat: 7,
      imageUrl: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e',
      cuisine: 'American',
      categoryId: categories[4].id
    },
    {
      userId: user.id,
      title: 'Smoothie Bowl',
      description: 'Thick berry smoothie bowl with granola topping',
      instructions: '1. Blend frozen berries with banana\n2. Add Greek yogurt for thickness\n3. Pour into bowl\n4. Top with granola, fresh fruit, and seeds\n5. Drizzle with honey',
      prepTime: 10,
      cookTime: 0,
      servings: 1,
      calories: 320,
      protein: 12,
      carbs: 58,
      fat: 6,
      imageUrl: 'https://images.unsplash.com/photo-1590301157890-4810ed352733',
      cuisine: 'American',
      categoryId: categories[0].id
    },
    {
      userId: user.id,
      title: 'Turkey Meatballs',
      description: 'Lean turkey meatballs in marinara sauce',
      instructions: '1. Mix ground turkey with breadcrumbs and seasonings\n2. Form into meatballs\n3. Brown in skillet\n4. Simmer in marinara sauce\n5. Serve over pasta or with bread',
      prepTime: 20,
      cookTime: 25,
      servings: 6,
      calories: 320,
      protein: 28,
      carbs: 18,
      fat: 14,
      imageUrl: 'https://images.unsplash.com/photo-1529042410759-befb1204b468',
      cuisine: 'Italian',
      categoryId: categories[12].id
    }
  ]);

  console.log('Created recipes');

  // Create meal plans (15+)
  const mealPlans = [];
  const startDates = [
    '2024-01-01', '2024-01-08', '2024-01-15', '2024-01-22', '2024-01-29',
    '2024-02-05', '2024-02-12', '2024-02-19', '2024-02-26', '2024-03-04',
    '2024-03-11', '2024-03-18', '2024-03-25', '2024-04-01', '2024-04-08'
  ];

  const mealPlanNames = [
    'Healthy Start 2024', 'Low Carb Week', 'Mediterranean Diet', 'High Protein Plan',
    'Vegetarian Week', 'Quick Meals Plan', 'Family Favorites', 'Budget Friendly',
    'Meal Prep Master', 'Clean Eating', 'Weight Loss Focus', 'Muscle Building',
    'Heart Healthy', 'Anti-Inflammatory', 'Energy Boost Week'
  ];

  for (let i = 0; i < 15; i++) {
    const mp = await MealPlan.create({
      userId: user.id,
      name: mealPlanNames[i],
      startDate: startDates[i],
      endDate: new Date(new Date(startDates[i]).getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      targetCalories: 1800 + (i % 5) * 200
    });
    mealPlans.push(mp);
  }

  console.log('Created meal plans');

  // Create meal plan items for ALL 15 meal plans
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  for (const mealPlan of mealPlans) {
    for (let day = 0; day < 7; day++) {
      for (const mealType of mealTypes) {
        const randomRecipe = recipes[Math.floor(Math.random() * recipes.length)];
        await MealPlanItem.create({
          mealPlanId: mealPlan.id,
          recipeId: randomRecipe.id,
          dayOfWeek: day,
          mealType
        });
      }
    }
  }

  console.log('Created meal plan items (28 per plan × 15 plans = 420 items)');

  // Create grocery lists (15+)
  const groceryLists = [];
  const groceryListNames = [
    'Weekly Groceries', 'Meal Prep Shopping', 'Party Supplies', 'Quick Trip List',
    'Healthy Essentials', 'Pantry Restock', 'Fresh Produce Run', 'Protein Haul',
    'Snack Attack', 'Breakfast Items', 'Dinner Ingredients', 'Baking Supplies',
    'Holiday Cooking', 'Summer BBQ', 'Winter Comfort Foods'
  ];

  // Additional grocery item names for variety
  const extraGroceryItems = [
    'Milk', 'Butter', 'Cheese', 'Bread', 'Pasta', 'Rice', 'Flour', 'Sugar',
    'Salt', 'Pepper', 'Olive Oil', 'Vinegar', 'Soy Sauce', 'Honey', 'Mustard',
    'Ketchup', 'Mayo', 'Lettuce', 'Cucumber', 'Carrots', 'Celery', 'Mushrooms'
  ];

  for (let i = 0; i < 15; i++) {
    const gl = await GroceryList.create({
      userId: user.id,
      mealPlanId: mealPlans[i % mealPlans.length].id,
      name: groceryListNames[i]
    });
    groceryLists.push(gl);

    // Add at least 15 items to each grocery list
    const usedNames = new Set();

    // First add items from ingredients
    for (let j = 0; j < Math.min(15, ingredients.length); j++) {
      const ingredient = ingredients[j];
      if (!usedNames.has(ingredient.name)) {
        usedNames.add(ingredient.name);
        await GroceryItem.create({
          groceryListId: gl.id,
          ingredientId: ingredient.id,
          name: ingredient.name,
          quantity: 1 + Math.floor(Math.random() * 3),
          unit: ['lbs', 'oz', 'cups', 'pieces'][Math.floor(Math.random() * 4)],
          checked: Math.random() > 0.7
        });
      }
    }

    // Add extra items to reach 15+ if needed
    for (let j = 0; usedNames.size < 15 && j < extraGroceryItems.length; j++) {
      const itemName = extraGroceryItems[j];
      if (!usedNames.has(itemName)) {
        usedNames.add(itemName);
        await GroceryItem.create({
          groceryListId: gl.id,
          ingredientId: null,
          name: itemName,
          quantity: 1 + Math.floor(Math.random() * 3),
          unit: ['lbs', 'oz', 'cups', 'pieces', 'bottles', 'bags'][Math.floor(Math.random() * 6)],
          checked: Math.random() > 0.7
        });
      }
    }
  }

  console.log('Created grocery lists with 15+ items each');

  // Create nutrition logs (15+)
  const today = new Date();
  for (let i = 0; i < 20; i++) {
    const logDate = new Date(today);
    logDate.setDate(today.getDate() - i);

    for (const mealType of mealTypes) {
      await NutritionLog.create({
        userId: user.id,
        date: logDate.toISOString().split('T')[0],
        mealType,
        calories: 300 + Math.floor(Math.random() * 400),
        protein: 15 + Math.floor(Math.random() * 25),
        carbs: 30 + Math.floor(Math.random() * 40),
        fat: 10 + Math.floor(Math.random() * 20),
        notes: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} on ${logDate.toDateString()}`
      });
    }
  }

  console.log('Created nutrition logs');

  // ==================== NEW AI FEATURE SEED DATA ====================

  // Create Dietary Profiles (15+)
  const dietaryProfilesData = [
    { name: 'Keto Diet Profile', restrictions: ['carbs'], allergies: [], preferences: 'High fat, moderate protein', targetCalories: 1800, targetProtein: 80, targetCarbs: 20, targetFat: 140 },
    { name: 'Vegan Lifestyle', restrictions: ['meat', 'dairy', 'eggs'], allergies: [], preferences: 'Plant-based whole foods', targetCalories: 2000, targetProtein: 60, targetCarbs: 280, targetFat: 65 },
    { name: 'Gluten-Free Plan', restrictions: ['gluten', 'wheat'], allergies: ['gluten'], preferences: 'Naturally gluten-free grains', targetCalories: 2000, targetProtein: 70, targetCarbs: 250, targetFat: 70 },
    { name: 'Mediterranean Style', restrictions: [], allergies: [], preferences: 'Olive oil, fish, vegetables', targetCalories: 2200, targetProtein: 85, targetCarbs: 260, targetFat: 90 },
    { name: 'Low FODMAP', restrictions: ['onion', 'garlic', 'wheat'], allergies: [], preferences: 'Gut-friendly foods', targetCalories: 1900, targetProtein: 70, targetCarbs: 220, targetFat: 75 },
    { name: 'Paleo Approach', restrictions: ['grains', 'dairy', 'legumes'], allergies: [], preferences: 'Whole foods, lean meats', targetCalories: 2100, targetProtein: 100, targetCarbs: 150, targetFat: 100 },
    { name: 'Dairy-Free Living', restrictions: ['dairy'], allergies: ['lactose'], preferences: 'Non-dairy alternatives', targetCalories: 2000, targetProtein: 75, targetCarbs: 260, targetFat: 65 },
    { name: 'Heart Healthy', restrictions: ['saturated fat', 'sodium'], allergies: [], preferences: 'Low sodium, healthy fats', targetCalories: 1800, targetProtein: 70, targetCarbs: 230, targetFat: 55 },
    { name: 'Diabetic Friendly', restrictions: ['sugar', 'refined carbs'], allergies: [], preferences: 'Low glycemic index foods', targetCalories: 1800, targetProtein: 80, targetCarbs: 180, targetFat: 70 },
    { name: 'High Protein Athlete', restrictions: [], allergies: [], preferences: 'Lean proteins, complex carbs', targetCalories: 2800, targetProtein: 180, targetCarbs: 300, targetFat: 80 },
    { name: 'Nut-Free Safe', restrictions: ['tree nuts', 'peanuts'], allergies: ['peanuts', 'tree nuts'], preferences: 'Seed-based alternatives', targetCalories: 2000, targetProtein: 75, targetCarbs: 250, targetFat: 70 },
    { name: 'Vegetarian Balance', restrictions: ['meat', 'fish'], allergies: [], preferences: 'Eggs and dairy allowed', targetCalories: 2000, targetProtein: 65, targetCarbs: 270, targetFat: 65 },
    { name: 'Anti-Inflammatory', restrictions: ['processed foods', 'sugar'], allergies: [], preferences: 'Omega-3 rich, colorful vegetables', targetCalories: 1900, targetProtein: 75, targetCarbs: 220, targetFat: 70 },
    { name: 'Whole30 Strict', restrictions: ['sugar', 'grains', 'dairy', 'legumes'], allergies: [], preferences: 'Whole foods only', targetCalories: 2000, targetProtein: 90, targetCarbs: 150, targetFat: 100 },
    { name: 'Pescatarian Choice', restrictions: ['meat', 'poultry'], allergies: [], preferences: 'Fish and seafood focus', targetCalories: 2100, targetProtein: 80, targetCarbs: 250, targetFat: 75 }
  ];

  for (const profile of dietaryProfilesData) {
    await DietaryProfile.create({
      userId: user.id,
      ...profile,
      aiRecommendations: {
        generatedAt: new Date().toISOString(),
        tips: ['Stay hydrated', 'Plan meals ahead', 'Read nutrition labels'],
        mealIdeas: ['Grilled protein with vegetables', 'Healthy grain bowl', 'Fresh salad with lean protein']
      }
    });
  }

  console.log('Created 15 dietary profiles');

  // Create Grocery Optimizations (15+)
  const groceryOptimizationsData = [
    { name: 'Weekly Budget $100', budget: 100, storePreference: 'Walmart', estimatedSavings: 15.50 },
    { name: 'Costco Bulk Buy', budget: 200, storePreference: 'Costco', estimatedSavings: 45.00 },
    { name: 'Organic Focus', budget: 150, storePreference: 'Whole Foods', estimatedSavings: 12.00 },
    { name: 'Trader Joes Run', budget: 80, storePreference: 'Trader Joes', estimatedSavings: 18.00 },
    { name: 'Aldi Savings', budget: 60, storePreference: 'Aldi', estimatedSavings: 22.00 },
    { name: 'Target One Stop', budget: 120, storePreference: 'Target', estimatedSavings: 10.00 },
    { name: 'Local Farmers Market', budget: 75, storePreference: 'Farmers Market', estimatedSavings: 8.00 },
    { name: 'Amazon Fresh Delivery', budget: 130, storePreference: 'Amazon Fresh', estimatedSavings: 5.00 },
    { name: 'Kroger Weekly Deals', budget: 90, storePreference: 'Kroger', estimatedSavings: 25.00 },
    { name: 'Meal Prep Sunday', budget: 140, storePreference: 'Any', estimatedSavings: 30.00 },
    { name: 'Party Planning', budget: 250, storePreference: 'Costco', estimatedSavings: 40.00 },
    { name: 'Quick Weeknight Meals', budget: 70, storePreference: 'Any', estimatedSavings: 12.00 },
    { name: 'Holiday Feast Prep', budget: 300, storePreference: 'Multiple', estimatedSavings: 55.00 },
    { name: 'College Budget Friendly', budget: 50, storePreference: 'Aldi', estimatedSavings: 15.00 },
    { name: 'Family of Five Weekly', budget: 180, storePreference: 'Walmart', estimatedSavings: 35.00 }
  ];

  for (const opt of groceryOptimizationsData) {
    await GroceryOptimization.create({
      userId: user.id,
      ...opt,
      originalItems: [
        { name: 'Chicken Breast', quantity: 2, unit: 'lbs', price: 8.99 },
        { name: 'Broccoli', quantity: 2, unit: 'heads', price: 3.99 },
        { name: 'Rice', quantity: 1, unit: 'bag', price: 4.99 }
      ],
      optimizedItems: [
        { name: 'Chicken Thighs', quantity: 2, unit: 'lbs', price: 5.99, savings: 3.00 },
        { name: 'Frozen Broccoli', quantity: 2, unit: 'bags', price: 2.99, savings: 1.00 },
        { name: 'Rice', quantity: 1, unit: 'bag', price: 4.99, savings: 0 }
      ],
      aiSuggestions: {
        tips: ['Buy proteins in bulk and freeze', 'Check weekly circulars', 'Use cashback apps'],
        alternatives: ['Store brand vs name brand', 'Seasonal produce options']
      },
      status: 'completed'
    });
  }

  console.log('Created 15 grocery optimizations');

  // Create Leftover Suggestions (15+)
  const leftoverSuggestionsData = [
    { name: 'Rotisserie Chicken Remake', leftovers: ['rotisserie chicken', 'rice', 'broccoli'] },
    { name: 'Sunday Roast Leftovers', leftovers: ['beef roast', 'potatoes', 'carrots', 'gravy'] },
    { name: 'Thanksgiving Turkey Ideas', leftovers: ['turkey', 'stuffing', 'cranberry sauce', 'mashed potatoes'] },
    { name: 'Pizza Night Extras', leftovers: ['pizza dough', 'cheese', 'pepperoni', 'vegetables'] },
    { name: 'Taco Tuesday Remains', leftovers: ['ground beef', 'cheese', 'lettuce', 'tortillas', 'salsa'] },
    { name: 'Pasta Party Surplus', leftovers: ['cooked pasta', 'marinara sauce', 'meatballs'] },
    { name: 'Stir Fry Vegetables', leftovers: ['mixed vegetables', 'tofu', 'rice', 'soy sauce'] },
    { name: 'BBQ Leftovers', leftovers: ['pulled pork', 'coleslaw', 'baked beans', 'cornbread'] },
    { name: 'Salmon Dinner Extras', leftovers: ['salmon', 'asparagus', 'lemon', 'quinoa'] },
    { name: 'Breakfast for Dinner', leftovers: ['eggs', 'bacon', 'hash browns', 'cheese'] },
    { name: 'Soup Ingredients', leftovers: ['chicken broth', 'vegetables', 'noodles', 'herbs'] },
    { name: 'Salad Bar Remains', leftovers: ['lettuce', 'tomatoes', 'cucumber', 'cheese', 'chicken'] },
    { name: 'Mexican Fiesta Extras', leftovers: ['rice', 'beans', 'chicken', 'peppers', 'onions'] },
    { name: 'Italian Night Surplus', leftovers: ['bread', 'olive oil', 'tomatoes', 'basil', 'mozzarella'] },
    { name: 'Asian Takeout Remix', leftovers: ['fried rice', 'lo mein', 'orange chicken', 'vegetables'] }
  ];

  for (const suggestion of leftoverSuggestionsData) {
    await LeftoverSuggestion.create({
      userId: user.id,
      ...suggestion,
      expirationPriority: true,
      suggestedRecipes: [
        { title: 'Creative Fried Rice', description: 'Use up proteins and vegetables', prepTime: 15 },
        { title: 'Leftover Soup', description: 'Simmer everything into a hearty soup', prepTime: 20 },
        { title: 'Wrap or Quesadilla', description: 'Wrap leftovers in tortilla with cheese', prepTime: 10 }
      ],
      aiRecommendations: {
        priority: 'Use proteins first, they spoil faster',
        tips: ['Properly store in airtight containers', 'Label with dates', 'Most items good for 3-4 days']
      },
      status: 'completed'
    });
  }

  console.log('Created 15 leftover suggestions');

  // Create Nutrition Balances (15+)
  const nutritionBalancesData = [];
  for (let i = 0; i < 15; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    nutritionBalancesData.push({
      name: `Daily Balance ${date.toLocaleDateString()}`,
      date: date.toISOString().split('T')[0],
      currentIntake: {
        calories: 1500 + Math.floor(Math.random() * 700),
        protein: 50 + Math.floor(Math.random() * 50),
        carbs: 150 + Math.floor(Math.random() * 100),
        fat: 40 + Math.floor(Math.random() * 40),
        fiber: 15 + Math.floor(Math.random() * 15),
        sugar: 20 + Math.floor(Math.random() * 30)
      },
      targetIntake: {
        calories: 2000,
        protein: 80,
        carbs: 250,
        fat: 65,
        fiber: 25,
        sugar: 30
      },
      balanceScore: 60 + Math.floor(Math.random() * 35),
      deficiencies: ['Fiber', 'Protein'].slice(0, Math.floor(Math.random() * 3)),
      excesses: ['Sugar', 'Sodium'].slice(0, Math.floor(Math.random() * 2))
    });
  }

  for (const balance of nutritionBalancesData) {
    await NutritionBalance.create({
      userId: user.id,
      ...balance,
      aiRecommendations: {
        summary: 'Overall nutrition is balanced with room for improvement',
        suggestions: [
          'Add more leafy greens for fiber',
          'Include a protein source at each meal',
          'Reduce processed sugar intake'
        ],
        mealIdeas: [
          'Greek yogurt with berries for protein and fiber',
          'Grilled chicken salad for lean protein',
          'Quinoa bowl with vegetables'
        ]
      }
    });
  }

  console.log('Created 15 nutrition balances');

  // Create Cooking Timers (15+)
  const cookingTimersData = [
    { name: 'Perfect Steak Timer', totalTime: 25, steps: [
      { stepNumber: 1, title: 'Season steak', duration: 5, type: 'prep' },
      { stepNumber: 2, title: 'Heat pan', duration: 3, type: 'active' },
      { stepNumber: 3, title: 'Sear first side', duration: 4, type: 'cooking' },
      { stepNumber: 4, title: 'Flip and sear', duration: 4, type: 'cooking' },
      { stepNumber: 5, title: 'Rest meat', duration: 5, type: 'rest' }
    ]},
    { name: 'Pasta Al Dente', totalTime: 20, steps: [
      { stepNumber: 1, title: 'Boil water', duration: 8, type: 'prep' },
      { stepNumber: 2, title: 'Add pasta', duration: 1, type: 'active' },
      { stepNumber: 3, title: 'Cook pasta', duration: 10, type: 'cooking' },
      { stepNumber: 4, title: 'Drain and serve', duration: 1, type: 'active' }
    ]},
    { name: 'Rice Cooker Perfect', totalTime: 35, steps: [
      { stepNumber: 1, title: 'Rinse rice', duration: 3, type: 'prep' },
      { stepNumber: 2, title: 'Add water', duration: 1, type: 'prep' },
      { stepNumber: 3, title: 'Cook rice', duration: 25, type: 'cooking' },
      { stepNumber: 4, title: 'Fluff and rest', duration: 5, type: 'rest' }
    ]},
    { name: 'Soft Boiled Eggs', totalTime: 12, steps: [
      { stepNumber: 1, title: 'Boil water', duration: 5, type: 'prep' },
      { stepNumber: 2, title: 'Add eggs', duration: 1, type: 'active' },
      { stepNumber: 3, title: 'Cook eggs', duration: 6, type: 'cooking' }
    ]},
    { name: 'Roast Chicken', totalTime: 90, steps: [
      { stepNumber: 1, title: 'Prep chicken', duration: 15, type: 'prep' },
      { stepNumber: 2, title: 'Preheat oven', duration: 10, type: 'prep' },
      { stepNumber: 3, title: 'Roast chicken', duration: 60, type: 'cooking' },
      { stepNumber: 4, title: 'Rest before carving', duration: 10, type: 'rest' }
    ]},
    { name: 'Quick Stir Fry', totalTime: 15, steps: [
      { stepNumber: 1, title: 'Prep vegetables', duration: 8, type: 'prep' },
      { stepNumber: 2, title: 'Heat wok', duration: 2, type: 'active' },
      { stepNumber: 3, title: 'Stir fry', duration: 5, type: 'cooking' }
    ]},
    { name: 'Homemade Pizza', totalTime: 45, steps: [
      { stepNumber: 1, title: 'Prep toppings', duration: 10, type: 'prep' },
      { stepNumber: 2, title: 'Roll dough', duration: 5, type: 'prep' },
      { stepNumber: 3, title: 'Preheat oven', duration: 15, type: 'prep' },
      { stepNumber: 4, title: 'Top pizza', duration: 5, type: 'active' },
      { stepNumber: 5, title: 'Bake pizza', duration: 12, type: 'cooking' }
    ]},
    { name: 'Grilled Salmon', totalTime: 20, steps: [
      { stepNumber: 1, title: 'Season salmon', duration: 5, type: 'prep' },
      { stepNumber: 2, title: 'Preheat grill', duration: 5, type: 'prep' },
      { stepNumber: 3, title: 'Grill salmon', duration: 10, type: 'cooking' }
    ]},
    { name: 'Vegetable Soup', totalTime: 45, steps: [
      { stepNumber: 1, title: 'Chop vegetables', duration: 15, type: 'prep' },
      { stepNumber: 2, title: 'Sauté aromatics', duration: 5, type: 'cooking' },
      { stepNumber: 3, title: 'Add broth and simmer', duration: 25, type: 'cooking' }
    ]},
    { name: 'Pancake Breakfast', totalTime: 25, steps: [
      { stepNumber: 1, title: 'Mix batter', duration: 5, type: 'prep' },
      { stepNumber: 2, title: 'Heat griddle', duration: 5, type: 'prep' },
      { stepNumber: 3, title: 'Cook pancakes', duration: 15, type: 'cooking' }
    ]},
    { name: 'Baked Potatoes', totalTime: 65, steps: [
      { stepNumber: 1, title: 'Prep potatoes', duration: 5, type: 'prep' },
      { stepNumber: 2, title: 'Preheat oven', duration: 10, type: 'prep' },
      { stepNumber: 3, title: 'Bake potatoes', duration: 50, type: 'cooking' }
    ]},
    { name: 'Chocolate Chip Cookies', totalTime: 35, steps: [
      { stepNumber: 1, title: 'Mix dough', duration: 10, type: 'prep' },
      { stepNumber: 2, title: 'Preheat oven', duration: 10, type: 'prep' },
      { stepNumber: 3, title: 'Scoop cookies', duration: 5, type: 'prep' },
      { stepNumber: 4, title: 'Bake cookies', duration: 12, type: 'cooking' }
    ]},
    { name: 'Omelette Master', totalTime: 15, steps: [
      { stepNumber: 1, title: 'Prep fillings', duration: 5, type: 'prep' },
      { stepNumber: 2, title: 'Beat eggs', duration: 2, type: 'prep' },
      { stepNumber: 3, title: 'Heat pan', duration: 2, type: 'active' },
      { stepNumber: 4, title: 'Cook omelette', duration: 5, type: 'cooking' }
    ]},
    { name: 'Slow Cooker Chili', totalTime: 360, steps: [
      { stepNumber: 1, title: 'Brown meat', duration: 15, type: 'cooking' },
      { stepNumber: 2, title: 'Add ingredients', duration: 5, type: 'prep' },
      { stepNumber: 3, title: 'Slow cook', duration: 360, type: 'cooking' }
    ]},
    { name: 'Fresh Bread', totalTime: 180, steps: [
      { stepNumber: 1, title: 'Mix dough', duration: 15, type: 'prep' },
      { stepNumber: 2, title: 'First rise', duration: 60, type: 'rest' },
      { stepNumber: 3, title: 'Shape loaf', duration: 10, type: 'prep' },
      { stepNumber: 4, title: 'Second rise', duration: 45, type: 'rest' },
      { stepNumber: 5, title: 'Bake bread', duration: 35, type: 'cooking' }
    ]}
  ];

  for (let i = 0; i < cookingTimersData.length; i++) {
    const timer = cookingTimersData[i];
    await CookingTimer.create({
      userId: user.id,
      recipeId: recipes[i % recipes.length].id,
      name: timer.name,
      steps: timer.steps,
      totalTime: timer.totalTime,
      currentStep: 0,
      status: 'pending',
      aiTimingAdvice: {
        tips: ['Set visual timers', 'Prepare mise en place', 'Use a thermometer for accuracy'],
        multitasking: 'While waiting, prep the next step'
      },
      notifications: [
        { time: 5, message: '5 minutes remaining' },
        { time: 1, message: 'Almost done!' }
      ]
    });
  }

  console.log('Created 15 cooking timers');

  console.log('Database seeding complete!');
}

module.exports = seed;

// Run directly when called from CLI
if (require.main === module) {
  const { sequelize } = require('../models');
  sequelize.sync({ force: true })
    .then(() => seed())
    .then(() => {
      console.log('Seeding finished successfully!');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding failed:', err);
      process.exit(1);
    });
}
