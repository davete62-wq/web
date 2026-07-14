import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import { query } from '../db/pool.js';
import { generateMealPlan } from '../services/mealPlanService.js';

export const mealPlanRoutes = express.Router();
mealPlanRoutes.use(requireAuth);

async function createTodayMealPlan(req, res, next) {
  try {
    const profileResult = await query(
      `SELECT app_private.decrypt_text(target_calories_encrypted)::int AS "targetCalories",
              app_private.decrypt_text(medical_conditions_encrypted)::jsonb AS "medicalConditions",
              app_private.decrypt_text(allergies_encrypted)::jsonb AS allergies,
              COALESCE(app_private.decrypt_text(preferences_encrypted)::jsonb, '{}'::jsonb) AS preferences
         FROM user_profiles
        WHERE user_id = $1`,
      [req.user.id]
    );

    const profile = profileResult.rows[0];
    if (!profile) return res.status(404).json({ error: 'Profile not found' });

    const plan = await generateMealPlan({
      targetCalories: profile.targetCalories,
      allergies: profile.allergies,
      medicalConditions: profile.medicalConditions,
      preferences: profile.preferences
    });

    const streakResult = await query(
      `SELECT streak_count FROM streaks
        WHERE user_id = $1
        ORDER BY check_in_date DESC
        LIMIT 1`,
      [req.user.id]
    );
    const streakCount = streakResult.rows[0]?.streak_count ?? 0;

    const { rows } = await query(
      `INSERT INTO meal_plans (user_id, plan_date, plan_json, streak_count)
       VALUES ($1, current_date, $2, $3)
       ON CONFLICT (user_id, plan_date) DO UPDATE SET
         plan_json = EXCLUDED.plan_json,
         streak_count = EXCLUDED.streak_count
       RETURNING id, plan_date, plan_json, streak_count`,
      [req.user.id, JSON.stringify(plan), streakCount]
    );

    res.json({ mealPlan: rows[0] });
  } catch (error) {
    next(error);
  }
}

mealPlanRoutes.post('/today', createTodayMealPlan);

mealPlanRoutes.get('/today', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT id, plan_date, plan_json, streak_count
         FROM meal_plans
        WHERE user_id = $1 AND plan_date = current_date
        LIMIT 1`,
      [req.user.id]
    );

    if (rows[0]) return res.json({ mealPlan: rows[0] });
    return createTodayMealPlan(req, res, next);
  } catch (error) {
    next(error);
  }
});

mealPlanRoutes.get('/current-week', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT plan_date, plan_json, streak_count
         FROM meal_plans
        WHERE user_id = $1
          AND plan_date >= current_date - interval '6 days'
        ORDER BY plan_date`,
      [req.user.id]
    );
    res.json({ days: rows });
  } catch (error) {
    next(error);
  }
});
