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
import DietaryRestrictionMapper from './pages/DietaryRestrictionMapper';
import AllergenDetection from './pages/AllergenDetection';
import SeasonalIngredientSuggester from './pages/SeasonalIngredientSuggester';
import BudgetOptimizer from './pages/BudgetOptimizer';
import MealPrepPlan from './pages/MealPrepPlan';

// === Batch 07 Gaps & Frontend Mounts ===
import CfNutritionistintheloopMealPlanning from './pages/CfNutritionistintheloopMealPlanning';
import CfAllergyintoleranceProfileBuilder from './pages/CfAllergyintoleranceProfileBuilder';
import CfCostminimizingMealPlanner from './pages/CfCostminimizingMealPlanner';
import CfCookingSkillProgression from './pages/CfCookingSkillProgression';
import CfFamilyMealConsensus from './pages/CfFamilyMealConsensus';
import CfRestaurantMenuDecoder from './pages/CfRestaurantMenuDecoder';
import GapNoDietaryrestrictionmapperRestrictionsIng from './pages/GapNoDietaryrestrictionmapperRestrictionsIng';
import GapNoBudgetoptimizerCostawareNutritionGoals from './pages/GapNoBudgetoptimizerCostawareNutritionGoals';
import GapNoAllergendetectionCrosscontaminationRisk from './pages/GapNoAllergendetectionCrosscontaminationRisk';
import GapNoSeasonalingredientsuggester from './pages/GapNoSeasonalingredientsuggester';
import GapNoMealprepplanBatchCookingRecommendation from './pages/GapNoMealprepplanBatchCookingRecommendation';
import GapNoMealPhotoRecognition from './pages/GapNoMealPhotoRecognition';
import GapNoRecipeRatingsreviewsRoute from './pages/GapNoRecipeRatingsreviewsRoute';
import GapNoGroceryStorePriceApiIntegration from './pages/GapNoGroceryStorePriceApiIntegration';
import GapNoBarcodeproductDatabaseLookupUsdaOpenf from './pages/GapNoBarcodeproductDatabaseLookupUsdaOpenf';
import GapNoPantryInventoryTracking from './pages/GapNoPantryInventoryTracking';
import GapNoSharingsocialFeatures from './pages/GapNoSharingsocialFeatures';
import GapNoNotificationsForShoppingReminders from './pages/GapNoNotificationsForShoppingReminders';
// === End Batch 07 ===

// Custom Views (4 endpoints, 4 components, 1 page)
import CustomViewsPage from './pages/CustomViewsPage';


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
              <Route path="/dietary-restriction-mapper" element={<ProtectedRoute><ErrorBoundary><DietaryRestrictionMapper /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/allergen-detection" element={<ProtectedRoute><ErrorBoundary><AllergenDetection /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/seasonal-ingredient-suggester" element={<ProtectedRoute><ErrorBoundary><SeasonalIngredientSuggester /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/budget-optimizer" element={<ProtectedRoute><ErrorBoundary><BudgetOptimizer /></ErrorBoundary></ProtectedRoute>} />
              <Route path="/meal-prep-plan" element={<ProtectedRoute><ErrorBoundary><MealPrepPlan /></ErrorBoundary></ProtectedRoute>} />
          // === Batch 07 Gaps & Frontend Mounts ===
          <Route path='/cf-nutritionistintheloop-meal-planning' element={<CfNutritionistintheloopMealPlanning />} />
          <Route path='/cf-allergyintolerance-profile-builder' element={<CfAllergyintoleranceProfileBuilder />} />
          <Route path='/cf-costminimizing-meal-planner' element={<CfCostminimizingMealPlanner />} />
          <Route path='/cf-cooking-skill-progression' element={<CfCookingSkillProgression />} />
          <Route path='/cf-family-meal-consensus' element={<CfFamilyMealConsensus />} />
          <Route path='/cf-restaurant-menu-decoder' element={<CfRestaurantMenuDecoder />} />
          <Route path='/gap-no-dietaryrestrictionmapper-restrictions-ing' element={<GapNoDietaryrestrictionmapperRestrictionsIng />} />
          <Route path='/gap-no-budgetoptimizer-costaware-nutrition-goals' element={<GapNoBudgetoptimizerCostawareNutritionGoals />} />
          <Route path='/gap-no-allergendetection-crosscontamination-risk' element={<GapNoAllergendetectionCrosscontaminationRisk />} />
          <Route path='/gap-no-seasonalingredientsuggester' element={<GapNoSeasonalingredientsuggester />} />
          <Route path='/gap-no-mealprepplan-batch-cooking-recommendation' element={<GapNoMealprepplanBatchCookingRecommendation />} />
          <Route path='/gap-no-meal-photo-recognition' element={<GapNoMealPhotoRecognition />} />
          <Route path='/gap-no-recipe-ratingsreviews-route' element={<GapNoRecipeRatingsreviewsRoute />} />
          <Route path='/gap-no-grocery-store-price-api-integration' element={<GapNoGroceryStorePriceApiIntegration />} />
          <Route path='/gap-no-barcodeproduct-database-lookup-usda-openf' element={<GapNoBarcodeproductDatabaseLookupUsdaOpenf />} />
          <Route path='/gap-no-pantry-inventory-tracking' element={<GapNoPantryInventoryTracking />} />
          <Route path='/gap-no-sharingsocial-features' element={<GapNoSharingsocialFeatures />} />
          <Route path='/gap-no-notifications-for-shopping-reminders' element={<GapNoNotificationsForShoppingReminders />} />
          // === End Batch 07 ===
              <Route path="/custom-views" element={<ProtectedRoute><ErrorBoundary><CustomViewsPage /></ErrorBoundary></ProtectedRoute>} />
            </Routes>
          </Router>
        </ErrorBoundary>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
