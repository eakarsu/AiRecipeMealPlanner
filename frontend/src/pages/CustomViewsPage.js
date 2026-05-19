import React from 'react';
import NutritionMacroChart from '../components/NutritionMacroChart';
import CuisineHeatmap from '../components/CuisineHeatmap';
import WeeklyMealPlanPDF from '../components/WeeklyMealPlanPDF';
import DietaryRulesEditor from '../components/DietaryRulesEditor';

export default function CustomViewsPage() {
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900" data-testid="custom-views-title">Meal Views</h1>
        <p className="text-gray-500 mt-1">Custom recipe & meal-planner analytics: macros, cuisine variety, weekly plan PDF, and dietary rules.</p>
      </div>
      <div className="grid grid-cols-1 gap-5">
        <NutritionMacroChart />
        <CuisineHeatmap />
        <WeeklyMealPlanPDF />
        <DietaryRulesEditor />
      </div>
    </div>
  );
}
