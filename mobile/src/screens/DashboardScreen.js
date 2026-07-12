import { Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MetricCard from '../components/MetricCard';
import ProgressBar from '../components/ProgressBar';

export default function DashboardScreen({ route, navigation }) {
  const profile = route.params?.profile ?? { targetCalories: 1850, weightKg: 70, goalWeightKg: 63 };
  const mealPlan = route.params?.mealPlan;
  const meals = mealPlan?.plan_json?.meals ? Object.values(mealPlan.plan_json.meals) : [];
  const daysFollowed = 5;
  const weekProgress = 5;

  return (
    <ScrollView className="flex-1 bg-mist px-5 pt-14" contentContainerStyle={{ paddingBottom: 40 }}>
      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-3xl font-bold text-ink">Today</Text>
          <Text className="text-sm text-slate-600">Simple numbers, Ethiopian foods.</Text>
        </View>
        <View className="flex-row items-center gap-1 rounded-lg bg-white px-3 py-2">
          <Ionicons name="flame" size={20} color="#e85d2a" />
          <Text className="text-lg font-bold text-ink">{daysFollowed}</Text>
        </View>
      </View>

      <View className="mt-6 flex-row gap-3">
        <MetricCard label="Daily target" value={`${profile.targetCalories}`} accent="#16745b" />
        <MetricCard label="Goal kg" value={`${profile.goalWeightKg}`} accent="#bf5f37" />
      </View>

      <View className="mt-5 rounded-lg bg-white p-4">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="font-bold text-ink">Current week</Text>
          <Text className="font-bold text-leaf">{weekProgress}/7 days</Text>
        </View>
        <ProgressBar value={weekProgress} max={7} />
      </View>

      <Text className="mt-6 text-xl font-bold text-ink">Meal plan</Text>
      <View className="mt-3 gap-3">
        {meals.length === 0 && (
          <View className="rounded-lg border border-slate-200 bg-white p-4">
            <Text className="font-bold text-ink">Generate today&apos;s plan</Text>
            <Text className="mt-2 text-slate-600">Meals appear here after the API creates a plan from the EFCT food table.</Text>
          </View>
        )}
        {meals.map((meal) => (
          <View key={meal.name} className="rounded-lg border border-slate-200 bg-white p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-bold text-ink">{meal.name}</Text>
              <Text className="font-bold text-leaf">{meal.calories} cal</Text>
            </View>
            <Text className="mt-2 text-slate-600">{meal.items.map((item) => item.name).join(' + ')}</Text>
          </View>
        ))}
      </View>

      <Pressable className="mt-6 flex-row items-center justify-center gap-2 rounded-lg bg-ink px-5 py-4" onPress={() => navigation.navigate('CheckIn', { profile })}>
        <Ionicons name="checkmark-circle" size={19} color="white" />
        <Text className="text-base font-bold text-white">Weekly check-in</Text>
      </Pressable>
    </ScrollView>
  );
}
