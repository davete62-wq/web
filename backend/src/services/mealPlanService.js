import { findFoodsForMealPlan } from './foodRepository.js';
import { polishMealPlanWithLlm } from './llmMealPlanService.js';

const defaultMealRatios = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1
};

function mealRatiosForCount(count) {
  if (count <= 2) return { lunch: 0.52, dinner: 0.48 };
  if (count === 3) return { breakfast: 0.28, lunch: 0.38, dinner: 0.34 };
  if (count >= 5) return { breakfast: 0.22, lunch: 0.3, dinner: 0.28, snack: 0.1, eveningSnack: 0.1 };
  return defaultMealRatios;
}

function pickClosest(foods, target, usedIds, preferredGroups) {
  const candidates = foods
    .filter((food) => !usedIds.has(food.id))
    .filter((food) => preferredGroups.length === 0 || preferredGroups.some((group) => food.food_group.toLowerCase().includes(group)))
    .sort((a, b) => Math.abs(Number(a.energy_kcal) - target) - Math.abs(Number(b.energy_kcal) - target));

  return candidates[0] ?? foods.find((food) => !usedIds.has(food.id));
}

function buildMeal(name, targetCalories, foods, usedIds, preferredGroups) {
  const selected = [];
  let calories = 0;

  for (const portion of [0.55, 0.3, 0.15]) {
    const food = pickClosest(foods, targetCalories * portion, usedIds, preferredGroups);
    if (!food) break;
    usedIds.add(food.id);
    const servingGrams = Math.max(60, Math.round((targetCalories * portion / Number(food.energy_kcal)) * 100));
    calories += Number(food.energy_kcal) * servingGrams / 100;
    selected.push({
      foodId: food.id,
      sourceCode: food.source_code,
      name: food.food_name,
      group: food.food_group,
      servingGrams,
      calories: Math.round(Number(food.energy_kcal) * servingGrams / 100),
      protein: Math.round(Number(food.protein ?? 0) * servingGrams) / 100,
      fat: Math.round(Number(food.fat ?? 0) * servingGrams) / 100,
      carbs: Math.round(Number(food.carbs ?? 0) * servingGrams) / 100
    });
  }

  return {
    name,
    targetCalories: Math.round(targetCalories),
    calories: Math.round(calories),
    items: selected
  };
}

export async function generateMealPlan({ targetCalories, allergies, medicalConditions, preferences = {} }) {
  const foods = await findFoodsForMealPlan({ targetCalories, allergies, medicalConditions });
  if (foods.length < 8) {
    throw new Error('Food data seed is too small to generate a compliant meal plan');
  }

  const usedIds = new Set();
  const ratios = mealRatiosForCount(Number(preferences.mealsPerDay ?? 4));
  const meals = {
    ...(ratios.breakfast ? { breakfast: buildMeal('Breakfast', targetCalories * ratios.breakfast, foods, usedIds, ['cereal', 'milk', 'egg']) } : {}),
    ...(ratios.lunch ? { lunch: buildMeal('Lunch', targetCalories * ratios.lunch, foods, usedIds, ['pulse', 'meat', 'vegetable', 'cereal']) } : {}),
    ...(ratios.dinner ? { dinner: buildMeal('Dinner', targetCalories * ratios.dinner, foods, usedIds, ['vegetable', 'pulse', 'meat', 'cereal']) } : {}),
    ...(ratios.snack ? { snack: buildMeal('Snack', targetCalories * ratios.snack, foods, usedIds, ['fruit', 'nut', 'milk']) } : {}),
    ...(ratios.eveningSnack ? { eveningSnack: buildMeal('Evening Snack', targetCalories * ratios.eveningSnack, foods, usedIds, ['fruit', 'nut', 'milk']) } : {})
  };

  const plan = {
    targetCalories,
    generatedAt: new Date().toISOString(),
    source: 'Ethiopian Food Composition Table 2025 food_data table',
    preferences: {
      mealsPerDay: Number(preferences.mealsPerDay ?? 4),
      monthlyFoodBudgetEtb: preferences.monthlyFoodBudgetEtb ?? null,
      waterGlassesPerDay: preferences.waterGlassesPerDay ?? null
    },
    meals,
    dailyCalories: Object.values(meals).reduce((sum, meal) => sum + meal.calories, 0)
  };

  return polishMealPlanWithLlm(plan);
}
