const activityMultipliers = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9
};

export function calculateDailyNeeds(profile) {
  const sexAdjustment = profile.sex === 'female' ? -161 : 5;
  const bmr = 10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexAdjustment;
  const maintenanceCalories = bmr * (activityMultipliers[profile.activityLevel] ?? 1.2);
  const goal = profile.preferences?.goal;
  const goalDelta = profile.goalWeightKg - profile.weightKg;
  const goalAdjustment =
    goal === 'lose_weight' ? -500 :
    goal === 'gain_weight' ? 300 :
    goalDelta < -1 ? -500 :
    goalDelta > 1 ? 300 :
    0;
  const targetCalories = Math.max(1200, Math.round(maintenanceCalories + goalAdjustment));

  return {
    bmr: Math.round(bmr),
    maintenanceCalories: Math.round(maintenanceCalories),
    targetCalories
  };
}
