import React from 'react';
import { useLocation } from 'react-router-dom';

const pageTitles = {
  '/': 'Dashboard',
  '/recipes': 'Recipes',
  '/meal-plans': 'Meal Plans',
  '/grocery-lists': 'Grocery Lists',
  '/nutrition': 'Nutrition Tracker',
  '/ingredients': 'Ingredients',
  '/categories': 'Categories',
  '/dietary-profiles': 'Dietary Adjuster',
  '/grocery-optimizations': 'Grocery Optimizer',
  '/leftover-suggestions': 'Leftover Suggester',
  '/nutrition-balances': 'Nutrition Balancer',
  '/cooking-timers': 'Cooking Timer',
};

function Header({ onMenuToggle }) {
  const location = useLocation();

  const getPageTitle = () => {
    const exactMatch = pageTitles[location.pathname];
    if (exactMatch) return exactMatch;

    const baseMatch = Object.entries(pageTitles).find(
      ([path]) => path !== '/' && location.pathname.startsWith(path)
    );
    if (baseMatch) {
      const isDetail = location.pathname.split('/').length > 2;
      return isDetail ? `${baseMatch[1]} / Detail` : baseMatch[1];
    }
    return 'Dashboard';
  };

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuToggle}
            className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors lg:hidden"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
          </button>

          {/* Page title */}
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="hidden sm:flex items-center">
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              <input
                type="text"
                placeholder="Search..."
                className="w-56 pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder-gray-400 transition-all focus:w-72"
              />
            </div>
          </div>

          {/* Notification bell */}
          <button className="relative p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
            </svg>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
