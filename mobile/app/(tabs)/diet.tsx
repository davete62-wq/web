import { useEffect, useMemo, useState } from 'react';
import { Image, ImageBackground, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import FoodCard, { FoodDetailSheet, FoodItem } from '../../components/FoodCard';
import ScaleButton from '../../components/ScaleButton';
import { fetchDietPlan } from '../../services/api';

const fallbackMeals: FoodItem[] = [
  { id: 'doro', name: 'Doro Wot Power Plate', mealType: 'Wot', calories: 620, protein: 46, carbs: 58, fat: 22, servingGrams: 420, ingredients: ['doro wot', 'injera', 'egg', 'greens'], recipe: 'A strength-focused Ethiopian plate with high protein, steady carbs, and satisfying spice.' },
  { id: 'shiro', name: 'Shiro Wot Recovery Bowl', mealType: 'stew', calories: 480, protein: 24, carbs: 72, fat: 12, servingGrams: 380, ingredients: ['shiro', 'injera', 'salad'], recipe: 'Plant-powered carbs and legumes for training recovery and energy.' },
  { id: 'tibs', name: 'Lean Tibs Macro Plate', mealType: 'lunch', calories: 540, protein: 44, carbs: 42, fat: 20, servingGrams: 350, ingredients: ['lean beef', 'peppers', 'injera'], recipe: 'Lean protein with controlled carbs for serious body composition goals.' }
];

function normalizeMeals(data: any): FoodItem[] {
  const source = data?.plan_json?.meals ?? data?.meals ?? data?.items ?? [];
  const list = Array.isArray(source) ? source : Object.values(source);
  return list.flatMap((meal: any) => {
    const items = meal?.items ?? [meal];
    return items.map((item: any, index: number) => ({
      id: item.id ?? item.foodId ?? `${meal.name ?? 'meal'}-${index}`,
      name: item.name ?? item.food_name ?? meal.name ?? 'TenaFit meal',
      mealType: meal.name ?? item.mealType ?? item.food_group,
      group: item.group ?? item.food_group,
      calories: Number(item.calories ?? item.energy_kcal ?? meal.calories ?? 0),
      protein: Number(item.protein ?? 0),
      carbs: Number(item.carbs ?? 0),
      fat: Number(item.fat ?? 0),
      servingGrams: Number(item.servingGrams ?? item.serving_grams ?? 100),
      ingredients: item.ingredients,
      recipe: item.recipe ?? meal.notes
    }));
  });
}

export default function DietScreen() {
  const [foods, setFoods] = useState<FoodItem[]>(fallbackMeals);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [selected, setSelected] = useState<FoodItem | null>(null);

  async function load() {
    setLoading(true);
    try {
      const data = await fetchDietPlan();
      const normalized = normalizeMeals(data);
      setFoods(normalized.length ? normalized : fallbackMeals);
      setOffline(false);
    } catch {
      setFoods(fallbackMeals);
      setOffline(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const totals = useMemo(() => foods.reduce((sum, food) => ({
    calories: sum.calories + (food.calories ?? 0),
    protein: sum.protein + (food.protein ?? 0),
    carbs: sum.carbs + (food.carbs ?? 0),
    fat: sum.fat + (food.fat ?? 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }), [foods]);

  return (
    <ImageBackground source={require('../../assets/brand/tenafit-bg.png')} className="flex-1" resizeMode="cover">
      <View className="absolute inset-0 bg-white/85" />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28 pt-14" refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor="#38bdf8" />}>
        <Animated.View entering={FadeInUp.duration(600)} className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="font-poppinsSemi text-xs uppercase tracking-[4px] text-skyDeep">TenaFit Wellness Hub</Text>
            <Text className="mt-2 font-exo text-4xl leading-[46px] text-ink">Dynamic Diet Plan</Text>
          </View>
          <Image source={require('../../assets/brand/pulse-logo.jpg')} className="h-16 w-20 rounded-2xl" resizeMode="contain" />
        </Animated.View>

        {offline && (
          <Animated.View entering={FadeInDown.duration(400)} className="mt-5 flex-row items-center rounded-2xl bg-softBeige px-4 py-3">
            <Ionicons name="cloud-offline" size={20} color="#0284c7" />
            <Text className="ml-3 flex-1 font-poppinsSemi text-sm text-ink">Server is offline, showing a safe local performance plan.</Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(120).duration(600)} className="mt-5 rounded-3xl bg-ink p-5">
          <Text className="font-poppinsSemi text-sm text-softBeige">Today’s macro target</Text>
          <Text className="mt-1 font-exo text-5xl text-white">{Math.round(totals.calories)}</Text>
          <Text className="font-poppins text-sm text-white/70">calories across mapped Ethiopian meals</Text>
          <View className="mt-5 flex-row gap-3">
            <Macro label="Protein" value={totals.protein} />
            <Macro label="Carbs" value={totals.carbs} />
            <Macro label="Fats" value={totals.fat} />
          </View>
        </Animated.View>

        <View className="mt-6 gap-4">
          {foods.map((food, index) => (
            <Animated.View key={`${food.id ?? food.name}-${index}`} entering={FadeInDown.delay(160 + index * 80).duration(520)}>
              <FoodCard food={food} onPress={() => setSelected(food)} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
      <FoodDetailSheet food={selected} visible={!!selected} onClose={() => setSelected(null)} />
    </ImageBackground>
  );
}

function Macro({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 rounded-2xl bg-white/10 p-3">
      <Text className="font-poppins text-xs text-white/60">{label}</Text>
      <Text className="font-exo text-2xl text-freshGreen">{Math.round(value)}g</Text>
    </View>
  );
}
