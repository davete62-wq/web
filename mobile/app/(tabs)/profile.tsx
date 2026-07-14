import { useState } from 'react';
import { Image, ImageBackground, ScrollView, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScaleButton from '../../components/ScaleButton';
import { createDietPlan, saveProfile } from '../../services/api';
import { useAuthStore } from '../../store/auth';

const fieldClass = 'mt-2 h-12 rounded-2xl border border-sand bg-softBeige/70 px-4 font-poppinsSemi text-base text-ink';

export default function ProfileScreen() {
  const logout = useAuthStore((state) => state.logout);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [form, setForm] = useState({
    age: '25',
    heightCm: '170',
    weightKg: '70',
    goalWeightKg: '65',
    sex: 'male',
    activityLevel: 'moderate',
    mealsPerDay: '4',
    waterGlassesPerDay: '8',
    monthlyFoodBudgetEtb: '6000',
    foodsLiked: 'injera, shiro, tibs',
    foodsDisliked: '',
    allergies: '',
    allergyOtherText: '',
    cookingSkill: 'beginner'
  });

  function setField(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    setMessage(null);
    const allergies = splitList(form.allergies);
    const profile = {
      age: Number(form.age),
      heightCm: Number(form.heightCm),
      weightKg: Number(form.weightKg),
      goalWeightKg: Number(form.goalWeightKg),
      sex: form.sex,
      activityLevel: form.activityLevel,
      medicalConditions: [],
      allergies: form.allergyOtherText ? [...allergies, form.allergyOtherText] : allergies,
      preferences: {
        goal: Number(form.goalWeightKg) < Number(form.weightKg) ? 'lose_weight' : Number(form.goalWeightKg) > Number(form.weightKg) ? 'gain_weight' : 'maintain',
        mealsPerDay: Number(form.mealsPerDay),
        waterGlassesPerDay: Number(form.waterGlassesPerDay),
        monthlyFoodBudgetEtb: Number(form.monthlyFoodBudgetEtb || 0),
        foodsLiked: splitList(form.foodsLiked),
        foodsDisliked: splitList(form.foodsDisliked),
        cookingSkill: form.cookingSkill,
        allergyOtherText: form.allergyOtherText
      }
    };

    try {
      await saveProfile(profile);
      await createDietPlan(profile);
      setMessage('Profile saved. Today’s food plan is ready.');
      router.replace('/(tabs)/diet');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save profile');
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    await logout();
    router.replace('/login');
  }

  return (
    <ImageBackground source={require('../../assets/brand/tenafit-bg.png')} className="flex-1" resizeMode="cover">
      <View className="absolute inset-0 bg-white/85" />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-28 pt-14">
        <View className="flex-row items-center">
          <Image source={require('../../assets/brand/pulse-logo.jpg')} className="h-20 w-24" resizeMode="contain" />
          <View className="ml-4 flex-1">
            <Text className="font-exo text-4xl text-ink">Profile</Text>
            <Text className="font-poppins text-sm text-smoke">Save your account details once. TenaFit uses them for daily food plans.</Text>
          </View>
        </View>

        <View className="mt-6 rounded-3xl bg-white/95 p-5 shadow-xl shadow-black/10">
          <Text className="font-poppinsBold text-lg text-ink">Body metrics</Text>
          <NumberField label="Age" value={form.age} onChange={(value) => setField('age', value)} />
          <NumberField label="Height (cm)" value={form.heightCm} onChange={(value) => setField('heightCm', value)} />
          <NumberField label="Current weight (kg)" value={form.weightKg} onChange={(value) => setField('weightKg', value)} />
          <NumberField label="Goal weight (kg)" value={form.goalWeightKg} onChange={(value) => setField('goalWeightKg', value)} />

          <Text className="mt-5 font-poppinsSemi text-sm text-ink">Gender</Text>
          <View className="mt-2 flex-row gap-3">
            <Choice active={form.sex === 'male'} label="Male" onPress={() => setField('sex', 'male')} />
            <Choice active={form.sex === 'female'} label="Female" onPress={() => setField('sex', 'female')} />
          </View>

          <Text className="mt-5 font-poppinsSemi text-sm text-ink">Meals and budget</Text>
          <NumberField label="Meals per day" value={form.mealsPerDay} onChange={(value) => setField('mealsPerDay', value)} />
          <NumberField label="Water glasses per day" value={form.waterGlassesPerDay} onChange={(value) => setField('waterGlassesPerDay', value)} />
          <NumberField label="Monthly food budget (ETB)" value={form.monthlyFoodBudgetEtb} onChange={(value) => setField('monthlyFoodBudgetEtb', value)} />

          <Text className="mt-5 font-poppinsSemi text-sm text-ink">Foods you like</Text>
          <TextInput value={form.foodsLiked} onChangeText={(value) => setField('foodsLiked', value)} className={fieldClass} placeholder="injera, shiro, tibs" />
          <Text className="mt-5 font-poppinsSemi text-sm text-ink">Foods you dislike</Text>
          <TextInput value={form.foodsDisliked} onChangeText={(value) => setField('foodsDisliked', value)} className={fieldClass} placeholder="comma separated" />
          <Text className="mt-5 font-poppinsSemi text-sm text-ink">Allergies</Text>
          <TextInput value={form.allergies} onChangeText={(value) => setField('allergies', value)} className={fieldClass} placeholder="peanut, milk, other" />
          {form.allergies.toLowerCase().includes('other') && (
            <TextInput value={form.allergyOtherText} onChangeText={(value) => setField('allergyOtherText', value)} className={fieldClass} placeholder="Please specify..." />
          )}

          {!!message && <Text className="mt-4 font-poppinsSemi text-sm text-skyDeep">{message}</Text>}
          <ScaleButton disabled={saving} onPress={submit} className="mt-6 h-14 flex-row items-center justify-center rounded-2xl bg-freshGreen">
            <Ionicons name="save" size={20} color="#fff" />
            <Text className="ml-2 font-poppinsBold text-base text-white">{saving ? 'Saving...' : 'Save profile'}</Text>
          </ScaleButton>
          <ScaleButton onPress={signOut} className="mt-3 h-12 items-center justify-center rounded-xl bg-ink">
            <Text className="font-poppinsSemi text-sm text-white">Log out</Text>
          </ScaleButton>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <View className="mt-3">
      <Text className="font-poppinsSemi text-sm text-ink">{label}</Text>
      <TextInput value={value} onChangeText={(text) => onChange(text.replace(/[^0-9.]/g, ''))} keyboardType="numeric" className={fieldClass} />
    </View>
  );
}

function Choice({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <ScaleButton onPress={onPress} className={`h-12 flex-1 items-center justify-center rounded-2xl ${active ? 'bg-skyPulse' : 'bg-softBeige'}`}>
      <Text className={`font-poppinsBold text-sm ${active ? 'text-white' : 'text-ink'}`}>{label}</Text>
    </ScaleButton>
  );
}

function splitList(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}
