import { findFoodsForMealPlan } from './foodRepository.js';
import { polishMealPlanWithLlm } from './llmMealPlanService.js';

const mealRatios = {
  breakfast: 0.25,
  lunch: 0.35,
  dinner: 0.3,
  snack: 0.1
};

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

export async function generateMealPlan({ targetCalories, allergies, medicalConditions }) {
  const foods = await findFoodsForMealPlan({ targetCalories, allergies, medicalConditions });
  if (foods.length < 8) {
    throw new Error('Food data seed is too small to generate a compliant meal plan');
  }

  const usedIds = new Set();
  const meals = {
    breakfast: buildMeal('Breakfast', targetCalories * mealRatios.breakfast, foods, usedIds, ['cereal', 'milk', 'egg']),
    lunch: buildMeal('Lunch', targetCalories * mealRatios.lunch, foods, usedIds, ['pulse', 'meat', 'vegetable', 'cereal']),
    dinner: buildMeal('Dinner', targetCalories * mealRatios.dinner, foods, usedIds, ['vegetable', 'pulse', 'meat', 'cereal']),
    snack: buildMeal('Snack', targetCalories * mealRatios.snack, foods, usedIds, ['fruit', 'nut', 'milk'])
  };

  const plan = {
    targetCalories,
    generatedAt: new Date().toISOString(),
    source: 'Ethiopian Food Composition Table 2025 food_data table',
    meals,
    dailyCalories: Object.values(meals).reduce((sum, meal) => sum + meal.calories, 0)
  };

  return polishMealPlanWithLlm(plan);
}
