import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ToastProvider from './components/ToastProvider';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import EmailVerification from './pages/EmailVerification';
import Dashboard from './pages/Dashboard';
import Recipes from './pages/Recipes';
import RecipeDetail from './pages/RecipeDetail';
import MealPlans from './pages/MealPlans';
import MealPlanDetail from './pages/MealPlanDetail';
import GroceryLists from './pages/GroceryLists';
import GroceryListDetail from './pages/GroceryListDetail';
import Nutrition from './pages/Nutrition';
import NutritionDetail from './pages/NutritionDetail';
import Ingredients from './pages/Ingredients';
import Categories from './pages/Categories';
import Profile from './pages/Profile';

// AI Feature Pages
import DietaryProfiles from './pages/DietaryProfiles';
import DietaryProfileDetail from './pages/DietaryProfileDetail';
import GroceryOptimizations from './pages/GroceryOptimizations';
import GroceryOptimizationDetail from './pages/GroceryOptimizationDetail';
import LeftoverSuggestions from './pages/LeftoverSuggestions';
import LeftoverSuggestionDetail from './pages/LeftoverSuggestionDetail';
import NutritionBalances from './pages/NutritionBalances';
import NutritionBalanceDetail from './pages/NutritionBalanceDetail';
import CookingTimers from './pages/CookingTimers';
import CookingTimerDetail from './pages/CookingTimerDetail';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <Layout>{children}</Layout>;
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ErrorBoundary>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/verify-email" element={<EmailVerification />} />

              {/* Protected Routes - each wrapped in per-page ErrorBoundary */}
              <Route path="/" element={<ProtectedRoute><ErrorBoundary><Dashboard /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><ErrorBoundary><Profile /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/recipes" element={<ProtectedRoute><ErrorBoundary><Recipes /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/recipes/:id" element={<ProtectedRoute><ErrorBoundary><RecipeDetail /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/meal-plans" element={<ProtectedRoute><ErrorBoundary><MealPlans /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/meal-plans/:id" element={<ProtectedRoute><ErrorBoundary><MealPlanDetail /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/grocery-lists" element={<ProtectedRoute><ErrorBoundary><GroceryLists /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/grocery-lists/:id" element={<ProtectedRoute><ErrorBoundary><GroceryListDetail /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/nutrition" element={<ProtectedRoute><ErrorBoundary><Nutrition /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/nutrition/:id" element={<ProtectedRoute><ErrorBoundary><NutritionDetail /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/ingredients" element={<ProtectedRoute><ErrorBoundary><Ingredients /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/categories" element={<ProtectedRoute><ErrorBoundary><Categories /></ErrorBoundary></ProtectedRoute>} />

              {/* AI Feature Routes */}
              <Route path="/dietary-profiles" element={<ProtectedRoute><ErrorBoundary><DietaryProfiles /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/dietary-profiles/:id" element={<ProtectedRoute><ErrorBoundary><DietaryProfileDetail /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/grocery-optimizations" element={<ProtectedRoute><ErrorBoundary><GroceryOptimizations /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/grocery-optimizations/:id" element={<ProtectedRoute><ErrorBoundary><GroceryOptimizationDetail /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/leftover-suggestions" element={<ProtectedRoute><ErrorBoundary><LeftoverSuggestions /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/leftover-suggestions/:id" element={<ProtectedRoute><ErrorBoundary><LeftoverSuggestionDetail /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/nutrition-balances" element={<ProtectedRoute><ErrorBoundary><NutritionBalances /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/nutrition-balances/:id" element={<ProtectedRoute><ErrorBoundary><NutritionBalanceDetail /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/cooking-timers" element={<ProtectedRoute><ErrorBoundary><CookingTimers /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/cooking-timers/:id" element={<ProtectedRoute><ErrorBoundary><CookingTimerDetail /></ErrorBoundary></ProtectedRoute>} />
            </Routes>
          </Router>
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
