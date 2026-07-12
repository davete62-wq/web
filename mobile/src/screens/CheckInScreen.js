import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ProgressBar from '../components/ProgressBar';

export default function CheckInScreen({ route, navigation }) {
  const profile = route.params?.profile ?? { weightKg: 70, goalWeightKg: 63 };
  const [weight, setWeight] = useState(String(profile.weightKg));
  const [followedPlan, setFollowedPlan] = useState(true);
  const goalReached = Math.abs(Number(weight) - Number(profile.goalWeightKg)) <= 0.5;

  return (
    <View className="flex-1 bg-mist px-5 pt-14">
      <Pressable onPress={() => navigation.goBack()} className="mb-5 h-10 w-10 items-center justify-center rounded-lg bg-white">
        <Ionicons name="arrow-back" size={20} color="#17231f" />
      </Pressable>

      <Text className="text-3xl font-bold text-ink">Weekly check-in</Text>
      <Text className="mt-2 text-slate-600">Update weight every 7 days to keep calories accurate.</Text>

      <View className="mt-6 rounded-lg bg-white p-4">
        <Text className="mb-2 font-semibold text-slate-600">Current weight (kg)</Text>
        <TextInput value={weight} onChangeText={setWeight} keyboardType="decimal-pad" className="rounded-lg border border-slate-200 px-4 py-3 text-lg font-bold text-ink" />
        <Text className="mb-2 mt-5 font-semibold text-slate-600">Goal progress</Text>
        <ProgressBar value={Math.max(0, profile.weightKg - Number(weight))} max={Math.max(1, profile.weightKg - profile.goalWeightKg)} color="#e85d2a" />
      </View>

      <Pressable onPress={() => setFollowedPlan(!followedPlan)} className="mt-4 flex-row items-center justify-between rounded-lg bg-white p-4">
        <Text className="font-bold text-ink">Followed this week</Text>
        <Ionicons name={followedPlan ? 'toggle' : 'toggle-outline'} size={34} color={followedPlan ? '#16745b' : '#94a3b8'} />
      </Pressable>

      <Pressable
        className="mt-6 flex-row items-center justify-center gap-2 rounded-lg bg-leaf px-5 py-4"
        onPress={() => (goalReached ? navigation.replace('Subscription') : navigation.replace('Dashboard', { profile: { ...profile, weightKg: Number(weight) } }))}
      >
        <Text className="text-base font-bold text-white">Save check-in</Text>
      </Pressable>
    </View>
  );
}
