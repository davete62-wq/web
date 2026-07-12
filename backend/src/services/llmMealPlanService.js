import { env } from '../config/env.js';

export async function polishMealPlanWithLlm(plan) {
  if (!env.openAiApiKey) return plan;

  const allowedFoods = Object.values(plan.meals)
    .flatMap((meal) => meal.items)
    .map((item) => ({
      foodId: item.foodId,
      sourceCode: item.sourceCode,
      name: item.name,
      servingGrams: item.servingGrams,
      calories: item.calories
    }));

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.openAiApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4.1-mini',
      temperature: 0.2,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: 'You format Ethiopian diet plans. You must only use the provided allowedFoods. Do not invent foods, nutrients, or source codes.'
        },
        {
          role: 'user',
          content: JSON.stringify({
            task: 'Return concise meal notes and prep tips for this plan without changing foods or servings.',
            allowedFoods,
            plan
          })
        }
      ]
    })
  });

  if (!response.ok) return plan;
  const body = await response.json();
  const content = body.choices?.[0]?.message?.content;
  if (!content) return plan;

  try {
    return {
      ...plan,
      llmNotes: JSON.parse(content),
      llmGuardrail: 'LLM output was constrained to EFCT-selected foods only.'
    };
  } catch {
    return plan;
  }
}
