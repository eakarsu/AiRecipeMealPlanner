import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Card from '../components/Card';
import LoadingSpinner from '../components/LoadingSpinner';

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          recipes, mealPlans, groceryLists, nutrition, ingredients, categories,
          dietaryProfiles, groceryOptimizations, leftoverSuggestions, nutritionBalances, cookingTimers
        ] = await Promise.all([
          api.get('/recipes'),
          api.get('/meal-plans'),
          api.get('/grocery-lists'),
          api.get('/nutrition'),
          api.get('/ingredients'),
          api.get('/categories'),
          api.get('/dietary-profiles'),
          api.get('/grocery-optimizations'),
          api.get('/leftover-suggestions'),
          api.get('/nutrition-balances'),
          api.get('/cooking-timers')
        ]);

        setStats({
          recipes: recipes.data.length,
          mealPlans: mealPlans.data.length,
          groceryLists: groceryLists.data.length,
          nutritionLogs: nutrition.data.length,
          ingredients: ingredients.data.length,
          categories: categories.data.length,
          dietaryProfiles: dietaryProfiles.data.length,
          groceryOptimizations: groceryOptimizations.data.length,
          leftoverSuggestions: leftoverSuggestions.data.length,
          nutritionBalances: nutritionBalances.data.length,
          cookingTimers: cookingTimers.data.length
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const coreFeatures = [
    {
      title: 'Recipes',
      description: 'Browse and create delicious recipes',
      icon: '📖',
      path: '/recipes',
      stat: stats?.recipes || 0,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Meal Plans',
      description: 'Plan your weekly meals with calorie tracking',
      icon: '📅',
      path: '/meal-plans',
      stat: stats?.mealPlans || 0,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Grocery Lists',
      description: 'Manage your shopping lists',
      icon: '🛒',
      path: '/grocery-lists',
      stat: stats?.groceryLists || 0,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Nutrition Tracker',
      description: 'Track your daily nutrition and macros',
      icon: '📊',
      path: '/nutrition',
      stat: stats?.nutritionLogs || 0,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Ingredients',
      description: 'Browse ingredient database with nutrition info',
      icon: '🥕',
      path: '/ingredients',
      stat: stats?.ingredients || 0,
      color: 'bg-red-50 text-red-600'
    },
    {
      title: 'Categories',
      description: 'Organize recipes by category',
      icon: '🏷️',
      path: '/categories',
      stat: stats?.categories || 0,
      color: 'bg-yellow-50 text-yellow-600'
    }
  ];

  const aiFeatures = [
    {
      title: 'AI Dietary Adjuster',
      description: 'Adjust recipes for dietary restrictions and allergies',
      icon: '🥗',
      path: '/dietary-profiles',
      stat: stats?.dietaryProfiles || 0,
      color: 'bg-emerald-50 text-emerald-600',
      gradient: 'from-emerald-500 to-teal-500'
    },
    {
      title: 'AI Grocery Optimizer',
      description: 'Optimize shopping lists for budget and efficiency',
      icon: '💰',
      path: '/grocery-optimizations',
      stat: stats?.groceryOptimizations || 0,
      color: 'bg-blue-50 text-blue-600',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      title: 'AI Leftover Suggester',
      description: 'Get creative recipes from your leftovers',
      icon: '🍲',
      path: '/leftover-suggestions',
      stat: stats?.leftoverSuggestions || 0,
      color: 'bg-orange-50 text-orange-600',
      gradient: 'from-orange-500 to-amber-500'
    },
    {
      title: 'AI Nutrition Balancer',
      description: 'Analyze and balance your daily nutrition',
      icon: '⚖️',
      path: '/nutrition-balances',
      stat: stats?.nutritionBalances || 0,
      color: 'bg-purple-50 text-purple-600',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      title: 'AI Cooking Timer',
      description: 'Smart cooking schedules with step-by-step guidance',
      icon: '⏱️',
      path: '/cooking-timers',
      stat: stats?.cookingTimers || 0,
      color: 'bg-red-50 text-red-600',
      gradient: 'from-red-500 to-rose-500'
    }
  ];

  if (loading) {
    return <LoadingSpinner size="lg" className="min-h-[50vh]" />;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome to your AI-powered meal planning assistant</p>
      </div>

      {/* AI Features Section */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">✨</span>
          <h2 className="text-xl font-bold text-gray-900">AI-Powered Features</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {aiFeatures.map((feature) => (
            <Card
              key={feature.path}
              onClick={() => navigate(feature.path)}
              className="group hover:shadow-lg transition-all duration-300"
            >
              <Card.Body className="relative overflow-hidden">
                <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${feature.gradient} opacity-10 rounded-bl-full`}></div>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${feature.color} flex items-center justify-center text-xl`}>
                    {feature.icon}
                  </div>
                  <span className="text-xl font-bold text-gray-900">{feature.stat}</span>
                </div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-1 text-gray-500 text-xs line-clamp-2">{feature.description}</p>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>

      {/* Core Features Section */}
      <div className="mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Core Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {coreFeatures.map((feature) => (
            <Card
              key={feature.path}
              onClick={() => navigate(feature.path)}
              className="group"
            >
              <Card.Body>
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center text-2xl`}>
                    {feature.icon}
                  </div>
                  <span className="text-2xl font-bold text-gray-900">{feature.stat}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="mt-1 text-gray-600 text-sm">{feature.description}</p>
              </Card.Body>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions Banner */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold">Quick AI Actions</h2>
            <p className="mt-2 text-primary-100">
              Generate recipes, plan meals, and get nutrition insights with AI
            </p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => navigate('/recipes')}
              className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Generate Recipe
            </button>
            <button
              onClick={() => navigate('/dietary-profiles')}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors"
            >
              Adjust Diet
            </button>
            <button
              onClick={() => navigate('/leftover-suggestions')}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors"
            >
              Use Leftovers
            </button>
            <button
              onClick={() => navigate('/cooking-timers')}
              className="bg-primary-500 text-white px-6 py-3 rounded-lg font-semibold hover:bg-primary-400 transition-colors"
            >
              Start Cooking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
