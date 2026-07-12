import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../db/pool.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dataPath = process.argv[2] ?? path.join(root, 'data', 'ethiopian-fct-food-data.json');
const foods = JSON.parse(await fs.readFile(dataPath, 'utf8'));

const client = await pool.connect();
try {
  await client.query('BEGIN');
  for (const food of foods) {
    await client.query(
      `INSERT INTO food_data (
         source_code, food_name, food_name_amharic, food_group, edible_portion,
         energy_kj, energy_kcal, protein, fat, carbs, fiber, ash, vitamins_minerals_json
       )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       ON CONFLICT (source_code) DO UPDATE SET
         food_name = EXCLUDED.food_name,
         food_name_amharic = EXCLUDED.food_name_amharic,
         food_group = EXCLUDED.food_group,
         edible_portion = EXCLUDED.edible_portion,
         energy_kj = EXCLUDED.energy_kj,
         energy_kcal = EXCLUDED.energy_kcal,
         protein = EXCLUDED.protein,
         fat = EXCLUDED.fat,
         carbs = EXCLUDED.carbs,
         fiber = EXCLUDED.fiber,
         ash = EXCLUDED.ash,
         vitamins_minerals_json = EXCLUDED.vitamins_minerals_json`,
      [
        food.source_code,
        food.food_name,
        food.food_name_amharic,
        food.food_group,
        food.edible_portion,
        food.energy_kj,
        food.energy_kcal,
        food.protein,
        food.fat,
        food.carbs,
        food.fiber,
        food.ash,
        food.vitamins_minerals_json ?? {}
      ]
    );
  }
  await client.query('COMMIT');
  console.log(`Seeded ${foods.length} EFCT foods`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
}
