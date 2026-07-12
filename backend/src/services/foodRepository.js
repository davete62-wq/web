import { query } from '../db/pool.js';

export async function findFoodsForMealPlan({ targetCalories, allergies = [], medicalConditions = [] }) {
  const allergyTerms = allergies.map((item) => item.toLowerCase()).filter(Boolean);
  const conditionTerms = medicalConditions.map((item) => item.toLowerCase()).filter(Boolean);
  const sodiumLimit = conditionTerms.some((item) => item.includes('hypertension')) ? 500 : null;

  const { rows } = await query(
    `SELECT id, source_code, food_name, food_group, energy_kcal, protein, fat, carbs, fiber,
            vitamins_minerals_json
       FROM food_data
      WHERE energy_kcal IS NOT NULL
        AND energy_kcal > 20
        AND ($1::numeric IS NULL OR (vitamins_minerals_json->>'sodium_mg')::numeric <= $1)
      ORDER BY
        CASE
          WHEN food_group ILIKE '%cereal%' THEN 1
          WHEN food_group ILIKE '%pulse%' THEN 2
          WHEN food_group ILIKE '%vegetable%' THEN 3
          WHEN food_group ILIKE '%meat%' THEN 4
          ELSE 5
        END,
        abs(energy_kcal - $2)
      LIMIT 220`,
    [sodiumLimit, Math.max(150, targetCalories / 4)]
  );

  return rows.filter((food) => {
    const haystack = `${food.food_name} ${food.food_group}`.toLowerCase();
    return !allergyTerms.some((term) => haystack.includes(term));
  });
}
