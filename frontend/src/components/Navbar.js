import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [aiMenuOpen, setAiMenuOpen] = useState(false);

  const coreLinks = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/recipes', label: 'Recipes', icon: '📖' },
    { path: '/meal-plans', label: 'Meal Plans', icon: '📅' },
    { path: '/grocery-lists', label: 'Grocery', icon: '🛒' },
    { path: '/nutrition', label: 'Nutrition', icon: '📊' },
  ];

  const aiLinks = [
    { path: '/dietary-profiles', label: 'Dietary Adjuster', icon: '🥗' },
    { path: '/grocery-optimizations', label: 'Grocery Optimizer', icon: '💰' },
    { path: '/leftover-suggestions', label: 'Leftover Suggester', icon: '🍲' },
    { path: '/nutrition-balances', label: 'Nutrition Balancer', icon: '⚖️' },
    { path: '/cooking-timers', label: 'Cooking Timer', icon: '⏱️' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isAiActive = aiLinks.some(link => location.pathname.startsWith(link.path));

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-2xl mr-2">🍽️</span>
              <span className="text-xl font-bold text-primary-600">MealPlanner</span>
            </Link>
            <div className="hidden md:ml-6 md:flex md:space-x-2">
              {coreLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive(link.path)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-1">{link.icon}</span>
                  {link.label}
                </Link>
              ))}

              {/* AI Features Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setAiMenuOpen(!aiMenuOpen)}
                  onBlur={() => setTimeout(() => setAiMenuOpen(false), 200)}
                  className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    isAiActive
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="mr-1">✨</span>
                  AI Features
                  <svg className={`ml-1 w-4 h-4 transition-transform ${aiMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {aiMenuOpen && (
                  <div className="absolute left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    {aiLinks.map((link) => (
                      <Link
                        key={link.path}
                        to={link.path}
                        onClick={() => setAiMenuOpen(false)}
                        className={`flex items-center px-4 py-2 text-sm ${
                          isActive(link.path)
                            ? 'text-purple-600 bg-purple-50'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="mr-2">{link.icon}</span>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-gray-700 mr-4 hidden sm:block">
              {user?.name}
            </span>
            <button
              onClick={logout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden ml-4 p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">Core Features</div>
            {coreLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'text-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
            <div className="border-t border-gray-200 my-2"></div>
            <div className="px-3 py-2 text-xs font-semibold text-purple-600 uppercase flex items-center">
              <span className="mr-1">✨</span> AI Features
            </div>
            {aiLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  isActive(link.path)
                    ? 'text-purple-600 bg-purple-50'
                    : 'text-gray-600 hover:text-purple-600 hover:bg-gray-50'
                }`}
              >
                <span className="mr-2">{link.icon}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
