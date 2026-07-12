import express from 'express';
import Joi from 'joi';
import { requireAuth } from '../middleware/auth.js';
import { query, withTransaction } from '../db/pool.js';
import { calculateDailyNeeds } from '../services/calorieService.js';

export const profileRoutes = express.Router();
profileRoutes.use(requireAuth);

const profileSchema = Joi.object({
  age: Joi.number().integer().min(13).max(100).required(),
  sex: Joi.string().valid('male', 'female').required(),
  heightCm: Joi.number().min(90).max(230).required(),
  weightKg: Joi.number().min(25).max(300).required(),
  activityLevel: Joi.string().valid('sedentary', 'light', 'moderate', 'very_active', 'athlete').required(),
  goalWeightKg: Joi.number().min(25).max(300).required(),
  medicalConditions: Joi.array().items(Joi.string().max(80)).default([]),
  allergies: Joi.array().items(Joi.string().max(80)).default([])
});

profileRoutes.put('/', async (req, res, next) => {
  try {
    const profile = profileSchema.validate(req.body, { stripUnknown: true }).value;
    const needs = calculateDailyNeeds(profile);

    await query(
      `INSERT INTO user_profiles (
         user_id, age_encrypted, height_cm_encrypted, weight_kg_encrypted, activity_level,
         goal_weight_kg_encrypted, target_calories_encrypted, medical_conditions_encrypted,
         allergies_encrypted, sex_encrypted
       )
       VALUES (
         $1,
         app_private.encrypt_text($2), app_private.encrypt_text($3), app_private.encrypt_text($4), $5,
         app_private.encrypt_text($6), app_private.encrypt_text($7),
         app_private.encrypt_text($8), app_private.encrypt_text($9), app_private.encrypt_text($10)
       )
       ON CONFLICT (user_id) DO UPDATE SET
         age_encrypted = EXCLUDED.age_encrypted,
         height_cm_encrypted = EXCLUDED.height_cm_encrypted,
         weight_kg_encrypted = EXCLUDED.weight_kg_encrypted,
         activity_level = EXCLUDED.activity_level,
         goal_weight_kg_encrypted = EXCLUDED.goal_weight_kg_encrypted,
         target_calories_encrypted = EXCLUDED.target_calories_encrypted,
         medical_conditions_encrypted = EXCLUDED.medical_conditions_encrypted,
         allergies_encrypted = EXCLUDED.allergies_encrypted,
         sex_encrypted = EXCLUDED.sex_encrypted`,
      [
        req.user.id,
        String(profile.age),
        String(profile.heightCm),
        String(profile.weightKg),
        profile.activityLevel,
        String(profile.goalWeightKg),
        String(needs.targetCalories),
        JSON.stringify(profile.medicalConditions),
        JSON.stringify(profile.allergies),
        profile.sex
      ]
    );

    res.json({ profile: { ...profile, targetCalories: needs.targetCalories }, needs });
  } catch (error) {
    next(error);
  }
});

profileRoutes.get('/', async (req, res, next) => {
  try {
    const { rows } = await query(
      `SELECT activity_level,
              app_private.decrypt_text(age_encrypted)::int AS age,
              app_private.decrypt_text(height_cm_encrypted)::numeric AS "heightCm",
              app_private.decrypt_text(weight_kg_encrypted)::numeric AS "weightKg",
              app_private.decrypt_text(goal_weight_kg_encrypted)::numeric AS "goalWeightKg",
              app_private.decrypt_text(target_calories_encrypted)::int AS "targetCalories",
              app_private.decrypt_text(medical_conditions_encrypted)::jsonb AS "medicalConditions",
              app_private.decrypt_text(allergies_encrypted)::jsonb AS allergies,
              app_private.decrypt_text(sex_encrypted) AS sex
         FROM user_profiles
        WHERE user_id = $1`,
      [req.user.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'Profile not found' });
    res.json({ profile: rows[0] });
  } catch (error) {
    next(error);
  }
});

profileRoutes.post('/weekly-check-in', async (req, res, next) => {
  try {
    const { currentWeightKg, followedPlan } = Joi.object({
      currentWeightKg: Joi.number().min(25).max(300).required(),
      followedPlan: Joi.boolean().required()
    }).validate(req.body).value;

    const result = await withTransaction(async (client) => {
      const profileResult = await client.query(
        `SELECT activity_level,
                app_private.decrypt_text(age_encrypted)::int AS age,
                app_private.decrypt_text(height_cm_encrypted)::numeric AS "heightCm",
                app_private.decrypt_text(goal_weight_kg_encrypted)::numeric AS "goalWeightKg",
                app_private.decrypt_text(medical_conditions_encrypted)::jsonb AS "medicalConditions",
                app_private.decrypt_text(allergies_encrypted)::jsonb AS allergies,
                app_private.decrypt_text(sex_encrypted) AS sex
           FROM user_profiles
          WHERE user_id = $1
          FOR UPDATE`,
        [req.user.id]
      );
      const existing = profileResult.rows[0];
      if (!existing) throw new Error('Profile not found');

      const needs = calculateDailyNeeds({
        age: existing.age,
        sex: existing.sex,
        heightCm: Number(existing.heightCm),
        weightKg: Number(currentWeightKg),
        goalWeightKg: Number(existing.goalWeightKg),
        activityLevel: existing.activity_level
      });

      const streakResult = await client.query(
        `SELECT streak_count FROM streaks
          WHERE user_id = $1 AND check_in_date < current_date
          ORDER BY check_in_date DESC
          LIMIT 1`,
        [req.user.id]
      );
      const previousStreak = streakResult.rows[0]?.streak_count ?? 0;
      const nextStreak = followedPlan ? previousStreak + 1 : 0;

      await client.query(
        `INSERT INTO streaks (user_id, check_in_date, followed_plan, current_weight_kg_encrypted, streak_count)
         VALUES ($1, current_date, $2, app_private.encrypt_text($3), $4)
         ON CONFLICT (user_id, check_in_date) DO UPDATE SET
           followed_plan = EXCLUDED.followed_plan,
           current_weight_kg_encrypted = EXCLUDED.current_weight_kg_encrypted,
           streak_count = EXCLUDED.streak_count`,
        [req.user.id, followedPlan, String(currentWeightKg), nextStreak]
      );

      await client.query(
        `UPDATE user_profiles
            SET weight_kg_encrypted = app_private.encrypt_text($2),
                target_calories_encrypted = app_private.encrypt_text($3)
          WHERE user_id = $1`,
        [req.user.id, String(currentWeightKg), String(needs.targetCalories)]
      );

      return {
        streakCount: nextStreak,
        targetCalories: needs.targetCalories,
        goalReached: Math.abs(Number(existing.goalWeightKg) - Number(currentWeightKg)) <= 0.5
      };
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});
