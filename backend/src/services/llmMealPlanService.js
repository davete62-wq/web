import { env } from '../config/env.js';

function localRecipeFor(item) {
  const name = String(item.name ?? 'meal').toLowerCase();
  if (name.includes('shiro')) return 'Simmer shiro powder with onion, garlic, berbere, and water until creamy. Serve with measured injera and salad.';
  if (name.includes('tibs') || name.includes('beef') || name.includes('meat')) return 'Saute lean meat with onion, pepper, garlic, and a small amount of oil. Keep the serving size measured for the calorie target.';
  if (name.includes('misir') || name.includes('lentil')) return 'Cook lentils with onion, garlic, berbere, and tomato until soft. Serve with the planned injera portion.';
  if (name.includes('injera')) return 'Use the planned injera grams as the carbohydrate portion. Pair it with the protein or stew listed in the same meal.';
  if (name.includes('vegetable') || name.includes('atkilt')) return 'Cook vegetables with onion, turmeric, garlic, and minimal oil. Keep the plate mostly vegetables for volume.';
  return 'Prepare this item using a simple low-oil method, then weigh or portion it according to the serving grams in the plan.';
}

function withLocalPrep(plan) {
  const meals = Object.fromEntries(
    Object.entries(plan.meals).map(([key, meal]) => [
      key,
      {
        ...meal,
        prepSteps: meal.items.map((item) => ({
          foodId: item.foodId,
          name: item.name,
          servingGrams: item.servingGrams,
          instructions: localRecipeFor(item)
        }))
      }
    ])
  );

  return {
    ...plan,
    meals,
    aiProvider: 'local-fallback',
    aiSummary: 'Gemini was not configured or did not return valid JSON, so TenaFit used EFCT foods with local preparation guidance.'
  };
}

export async function polishMealPlanWithLlm(plan, profile = {}) {
  const fallbackPlan = withLocalPrep(plan);
  if (!env.geminiApiKey) return fallbackPlan;

  const allowedFoods = Object.values(plan.meals)
    .flatMap((meal) => meal.items)
    .map((item) => ({
      foodId: item.foodId,
      sourceCode: item.sourceCode,
      name: item.name,
      group: item.group,
      servingGrams: item.servingGrams,
      calories: item.calories,
      protein: item.protein,
      carbs: item.carbs,
      fat: item.fat
    }));

  const prompt = {
    task: 'Return JSON only. Add concise Ethiopian food preparation instructions and daily coaching notes. Do not change foods, serving grams, calories, source codes, or meal names.',
    userProfile: {
      age: profile.age,
      sex: profile.sex,
      heightCm: profile.heightCm,
      weightKg: profile.weightKg,
      goalWeightKg: profile.goalWeightKg,
      activityLevel: profile.activityLevel,
      preferences: profile.preferences,
      allergies: profile.allergies
    },
    calorieMath: {
      targetCalories: plan.targetCalories,
      dailyCalories: plan.dailyCalories
    },
    allowedFoods,
    requiredShape: {
      aiSummary: 'short explanation of why this plan fits the user',
      meals: {
        mealKey: {
          prepSteps: [
            {
              foodId: 'must match an allowed foodId',
              instructions: 'how to prepare this exact food and portion'
            }
          ]
        }
      }
    }
  };

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      generationConfig: {
        temperature: 0.25,
        responseMimeType: 'application/json'
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: JSON.stringify(prompt) }]
        }
      ]
    })
  });

  if (!response.ok) return fallbackPlan;
  const body = await response.json();
  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return fallbackPlan;

  try {
    const ai = JSON.parse(text);
    const meals = Object.fromEntries(
      Object.entries(fallbackPlan.meals).map(([key, meal]) => {
        const aiSteps = Array.isArray(ai.meals?.[key]?.prepSteps) ? ai.meals[key].prepSteps : [];
        return [
          key,
          {
            ...meal,
            prepSteps: meal.items.map((item) => {
              const aiStep = aiSteps.find((step) => String(step.foodId) === String(item.foodId));
              return {
                foodId: item.foodId,
                name: item.name,
                servingGrams: item.servingGrams,
                instructions: aiStep?.instructions ?? localRecipeFor(item)
              };
            })
          }
        ];
      })
    );

    return {
      ...plan,
      meals,
      aiProvider: 'gemini',
      aiSummary: ai.aiSummary ?? 'Gemini prepared cooking notes using EFCT-selected foods.',
      aiGuardrail: 'Gemini output was constrained to EFCT-selected foods and fixed serving sizes.'
    };
  } catch {
    return fallbackPlan;
  }
}
