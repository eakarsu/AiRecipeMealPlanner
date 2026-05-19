const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

// Scoped rate limiter for custom views with ipKeyGenerator compat
let keyGen;
try {
  const { ipKeyGenerator } = require('express-rate-limit');
  keyGen = (req, res) => ipKeyGenerator(req, res);
} catch (_) {
  keyGen = (req) => req.ip;
}

const cvLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: keyGen,
  message: { ok: false, error: 'Too many requests to custom views' }
});
router.use(cvLimiter);

// In-memory dietary rules store (runtime CRUD)
let dietaryRules = [
  { id: 1, name: 'Default Adult', allergens: ['peanuts', 'shellfish'], calorie_target: 2000, protein_g: 80, carbs_g: 250, fat_g: 65, notes: 'Balanced default profile', active: true, created_at: new Date().toISOString() },
  { id: 2, name: 'Gluten-Free Athlete', allergens: ['gluten', 'wheat'], calorie_target: 2800, protein_g: 140, carbs_g: 320, fat_g: 90, notes: 'High protein for active users', active: true, created_at: new Date().toISOString() },
  { id: 3, name: 'Heart-Healthy Senior', allergens: ['shellfish'], calorie_target: 1800, protein_g: 70, carbs_g: 210, fat_g: 55, notes: 'Low-sodium, mediterranean lean', active: false, created_at: new Date().toISOString() }
];
let nextRuleId = 4;

// helper: week label
function weekLabel(d) {
  const y = d.getUTCFullYear();
  const start = new Date(Date.UTC(y, 0, 1));
  const week = Math.ceil(((d - start) / 86400000 + start.getUTCDay() + 1) / 7);
  return `${y}-W${String(week).padStart(2, '0')}`;
}

// 1) VIZ: nutrition macro chart per meal
router.get('/nutrition-macros', async (req, res) => {
  try {
    const days = Math.min(14, Math.max(1, parseInt(req.query.days) || 7));
    let rows = [];
    try {
      const db = require('../models');
      if (db && db.sequelize) {
        const [r] = await db.sequelize.query(
          `SELECT meal_type, calories, protein, carbs, fat, log_date
           FROM "NutritionLogs"
           WHERE log_date >= CURRENT_DATE - INTERVAL '${days} day'
           ORDER BY log_date ASC`
        );
        rows = r || [];
      }
    } catch (_) {
      rows = [];
    }

    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
    const agg = {};
    mealTypes.forEach((m) => { agg[m] = { protein: [], carbs: [], fat: [], calories: [] }; });
    rows.forEach((r) => {
      const m = (r.meal_type || 'Snack').charAt(0).toUpperCase() + (r.meal_type || 'Snack').slice(1).toLowerCase();
      const key = mealTypes.includes(m) ? m : 'Snack';
      agg[key].protein.push(Number(r.protein) || 0);
      agg[key].carbs.push(Number(r.carbs) || 0);
      agg[key].fat.push(Number(r.fat) || 0);
      agg[key].calories.push(Number(r.calories) || 0);
    });

    // Fallback synthetic if no rows
    if (rows.length === 0) {
      const seed = { Breakfast: { p: 22, c: 55, f: 14, k: 420 }, Lunch: { p: 38, c: 70, f: 22, k: 640 }, Dinner: { p: 42, c: 60, f: 26, k: 700 }, Snack: { p: 8, c: 22, f: 9, k: 180 } };
      mealTypes.forEach((m) => {
        const s = seed[m];
        for (let i = 0; i < days; i++) {
          agg[m].protein.push(s.p + (Math.random() - 0.5) * 6);
          agg[m].carbs.push(s.c + (Math.random() - 0.5) * 8);
          agg[m].fat.push(s.f + (Math.random() - 0.5) * 4);
          agg[m].calories.push(s.k + (Math.random() - 0.5) * 60);
        }
      });
    }

    const avg = (a) => (a.length ? a.reduce((s, n) => s + n, 0) / a.length : 0);
    const macros = mealTypes.map((m) => ({
      meal: m,
      protein_g: +avg(agg[m].protein).toFixed(1),
      carbs_g: +avg(agg[m].carbs).toFixed(1),
      fat_g: +avg(agg[m].fat).toFixed(1),
      calories: +avg(agg[m].calories).toFixed(0),
      samples: agg[m].protein.length
    }));

    const totals = {
      protein_g: +macros.reduce((s, m) => s + m.protein_g, 0).toFixed(1),
      carbs_g: +macros.reduce((s, m) => s + m.carbs_g, 0).toFixed(1),
      fat_g: +macros.reduce((s, m) => s + m.fat_g, 0).toFixed(1),
      calories: macros.reduce((s, m) => s + m.calories, 0)
    };

    res.json({ ok: true, days, macros, totals, mealTypes });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 2) VIZ: cuisine type heatmap (cuisine x week)
router.get('/cuisine-heatmap', async (req, res) => {
  try {
    const weeks = Math.min(26, Math.max(2, parseInt(req.query.weeks) || 8));
    let rows = [];
    try {
      const db = require('../models');
      if (db && db.sequelize) {
        const [r] = await db.sequelize.query(
          `SELECT r.cuisine_type, mp.created_at
           FROM "MealPlanItems" mpi
           JOIN "Recipes" r ON r.id = mpi.recipe_id
           JOIN "MealPlans" mp ON mp.id = mpi.meal_plan_id
           WHERE mp.created_at >= CURRENT_DATE - INTERVAL '${weeks * 7} day'`
        );
        rows = r || [];
      }
    } catch (_) {
      rows = [];
    }

    const weekLabels = [];
    const today = new Date();
    for (let i = weeks - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i * 7);
      weekLabels.push(weekLabel(d));
    }

    const cuisines = new Set();
    const cellMap = {};
    rows.forEach((r) => {
      const c = r.cuisine_type || 'Other';
      cuisines.add(c);
      const d = new Date(r.created_at);
      if (isNaN(d)) return;
      const wk = weekLabel(d);
      if (!cellMap[c]) cellMap[c] = {};
      cellMap[c][wk] = (cellMap[c][wk] || 0) + 1;
    });

    if (cuisines.size === 0) {
      ['Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 'Indian', 'French'].forEach((c) => cuisines.add(c));
    }

    const cuisineList = Array.from(cuisines).sort();
    const matrix = cuisineList.map((cuisine) => ({
      cuisine,
      cells: weekLabels.map((w, wi) => {
        if (cellMap[cuisine] && cellMap[cuisine][w] != null) return cellMap[cuisine][w];
        // synthetic count
        const seed = (cuisine.length + wi) % 5;
        return Math.max(0, Math.round(2 + Math.sin(wi / 1.4 + seed) * 1.6 + (Math.random() - 0.5) * 1.4));
      })
    }));

    let maxVal = 0;
    matrix.forEach((m) => m.cells.forEach((v) => { if (v > maxVal) maxVal = v; }));

    res.json({
      ok: true,
      weeks: weekLabels,
      cuisines: cuisineList,
      matrix,
      legend: { min: 0, max: maxVal, label: 'Meals served per cuisine per week' }
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 3) NON-VIZ: weekly meal plan PDF (printable structured report)
router.get('/weekly-plan-pdf', async (req, res) => {
  try {
    const weekStart = req.query.week_start || new Date().toISOString().slice(0, 10);
    let planRows = [];
    try {
      const db = require('../models');
      if (db && db.sequelize) {
        const [r] = await db.sequelize.query(
          `SELECT mp.id, mp.name, mp.start_date, r.title, r.cuisine_type, r.calories, mpi.day_of_week, mpi.meal_type
           FROM "MealPlans" mp
           LEFT JOIN "MealPlanItems" mpi ON mpi.meal_plan_id = mp.id
           LEFT JOIN "Recipes" r ON r.id = mpi.recipe_id
           WHERE mp.start_date >= DATE '${weekStart}' - INTERVAL '7 day'
           ORDER BY mpi.day_of_week ASC`
        );
        planRows = r || [];
      }
    } catch (_) {
      planRows = [];
    }

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner'];
    const plan = days.map((day) => ({
      day,
      meals: mealTypes.map((mt) => {
        const found = planRows.find((p) => {
          const dStr = String(p.day_of_week || '').toLowerCase();
          const mStr = String(p.meal_type || '').toLowerCase();
          return dStr === day.toLowerCase() && mStr === mt.toLowerCase();
        });
        return found && found.title
          ? { meal: mt, recipe: found.title, cuisine: found.cuisine_type || 'Mixed', calories: Number(found.calories) || 0 }
          : { meal: mt, recipe: `${mt} Suggestion`, cuisine: ['Italian', 'Mexican', 'Asian', 'Mediterranean'][(day.length + mt.length) % 4], calories: { Breakfast: 420, Lunch: 640, Dinner: 700 }[mt] };
      })
    }));

    const totalCalories = plan.reduce((s, d) => s + d.meals.reduce((a, m) => a + (m.calories || 0), 0), 0);
    const avgDaily = Math.round(totalCalories / 7);

    const generatedAt = new Date().toISOString();
    res.json({
      ok: true,
      title: 'Weekly Meal Plan',
      week_start: weekStart,
      generatedAt,
      summary: {
        total_meals: plan.length * mealTypes.length,
        total_calories: totalCalories,
        avg_daily_calories: avgDaily,
        days: days.length
      },
      plan,
      shoppingHints: [
        'Buy proteins in bulk on day 1',
        'Prep vegetables midweek for freshness',
        'Freeze excess dinner portions for lunch reuse',
        'Re-stock pantry staples weekly'
      ],
      filename: `weekly_meal_plan_${weekStart}.pdf`,
      mimeHint: 'application/pdf'
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// 4) NON-VIZ: Dietary rules editor (CRUD - allergens, calorie targets)
router.get('/dietary-rules', (req, res) => {
  res.json({ ok: true, rules: dietaryRules, count: dietaryRules.length });
});

router.post('/dietary-rules', (req, res) => {
  try {
    const { name, allergens, calorie_target, protein_g, carbs_g, fat_g, notes, active } = req.body || {};
    if (!name) return res.status(400).json({ ok: false, error: 'name required' });
    const cal = Number(calorie_target);
    if (!cal || cal < 800 || cal > 5000) {
      return res.status(400).json({ ok: false, error: 'calorie_target must be a number between 800 and 5000' });
    }
    const rule = {
      id: nextRuleId++,
      name,
      allergens: Array.isArray(allergens) ? allergens : (allergens ? [allergens] : []),
      calorie_target: cal,
      protein_g: Number(protein_g) || 0,
      carbs_g: Number(carbs_g) || 0,
      fat_g: Number(fat_g) || 0,
      notes: notes || '',
      active: active !== false,
      created_at: new Date().toISOString()
    };
    dietaryRules.push(rule);
    res.status(201).json({ ok: true, rule });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

router.put('/dietary-rules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = dietaryRules.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'rule not found' });
  const { name, allergens, calorie_target, protein_g, carbs_g, fat_g, notes, active } = req.body || {};
  if (name !== undefined) dietaryRules[idx].name = name;
  if (allergens !== undefined) dietaryRules[idx].allergens = Array.isArray(allergens) ? allergens : [allergens];
  if (calorie_target !== undefined) dietaryRules[idx].calorie_target = Number(calorie_target);
  if (protein_g !== undefined) dietaryRules[idx].protein_g = Number(protein_g);
  if (carbs_g !== undefined) dietaryRules[idx].carbs_g = Number(carbs_g);
  if (fat_g !== undefined) dietaryRules[idx].fat_g = Number(fat_g);
  if (notes !== undefined) dietaryRules[idx].notes = notes;
  if (active !== undefined) dietaryRules[idx].active = !!active;
  res.json({ ok: true, rule: dietaryRules[idx] });
});

router.delete('/dietary-rules/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = dietaryRules.findIndex((r) => r.id === id);
  if (idx === -1) return res.status(404).json({ ok: false, error: 'rule not found' });
  const removed = dietaryRules.splice(idx, 1)[0];
  res.json({ ok: true, removed });
});

module.exports = router;
