import { useState } from 'react';
import { ImageBackground, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const activityOptions = ['sedentary', 'light', 'moderate', 'very_active'];

export default function OnboardingScreen({ navigation }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    age: '29',
    sex: 'female',
    heightCm: '165',
    weightKg: '70',
    goalWeightKg: '63',
    activityLevel: 'moderate',
    allergies: '',
    medicalConditions: ''
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const canFinish = step === 2;

  function finish() {
    const targetCalories = 1850;
    navigation.replace('Dashboard', {
      profile: {
        ...form,
        age: Number(form.age),
        heightCm: Number(form.heightCm),
        weightKg: Number(form.weightKg),
        goalWeightKg: Number(form.goalWeightKg),
        targetCalories,
        allergies: form.allergies.split(',').map((item) => item.trim()).filter(Boolean),
        medicalConditions: form.medicalConditions.split(',').map((item) => item.trim()).filter(Boolean)
      }
    });
  }

  return (
    <ScrollView className="flex-1 bg-mist" contentContainerStyle={{ paddingBottom: 32 }}>
      <ImageBackground
        source={require('../../assets/ethiopia-hero.png')}
        className="min-h-[250px] justify-end px-6 pb-6"
        imageStyle={{ opacity: 0.92 }}
      >
        <Text className="text-4xl font-bold text-white">TenaFit</Text>
        <Text className="mt-2 max-w-[300px] text-base font-medium text-white">
          Ethiopian meals, clear numbers, steady weekly progress.
        </Text>
      </ImageBackground>

      <View className="px-5 pt-5">
        <View className="mb-5 flex-row gap-2">
          {[0, 1, 2].map((item) => (
            <View key={item} className="h-2 flex-1 rounded-full" style={{ backgroundColor: item <= step ? '#16745b' : '#d4e6df' }} />
          ))}
        </View>

        {step === 0 && (
          <View className="gap-3">
            <Text className="text-xl font-bold text-ink">Your body numbers</Text>
            <Field label="Age" value={form.age} onChangeText={(value) => update('age', value)} keyboardType="number-pad" />
            <Field label="Height (cm)" value={form.heightCm} onChangeText={(value) => update('heightCm', value)} keyboardType="number-pad" />
            <Field label="Current weight (kg)" value={form.weightKg} onChangeText={(value) => update('weightKg', value)} keyboardType="number-pad" />
            <Field label="Goal weight (kg)" value={form.goalWeightKg} onChangeText={(value) => update('goalWeightKg', value)} keyboardType="number-pad" />
          </View>
        )}

        {step === 1 && (
          <View className="gap-3">
            <Text className="text-xl font-bold text-ink">Activity and health</Text>
            <View className="flex-row gap-2">
              {['female', 'male'].map((sex) => (
                <Choice key={sex} active={form.sex === sex} label={sex} onPress={() => update('sex', sex)} />
              ))}
            </View>
            <View className="flex-row flex-wrap gap-2">
              {activityOptions.map((activity) => (
                <Choice key={activity} active={form.activityLevel === activity} label={activity.replace('_', ' ')} onPress={() => update('activityLevel', activity)} />
              ))}
            </View>
            <Field label="Medical conditions" value={form.medicalConditions} onChangeText={(value) => update('medicalConditions', value)} placeholder="hypertension, diabetes" />
          </View>
        )}

        {step === 2 && (
          <View className="gap-3">
            <Text className="text-xl font-bold text-ink">Food restrictions</Text>
            <Field label="Allergies" value={form.allergies} onChangeText={(value) => update('allergies', value)} placeholder="nuts, milk" />
            <View className="rounded-lg bg-white p-4">
              <View className="flex-row items-center gap-2">
                <Ionicons name="shield-checkmark" size={20} color="#16745b" />
                <Text className="font-bold text-ink">Private by design</Text>
              </View>
              <Text className="mt-2 text-sm text-slate-600">
                Health and personal metrics are encrypted before storage.
              </Text>
            </View>
          </View>
        )}

        <Pressable
          className="mt-6 flex-row items-center justify-center gap-2 rounded-lg bg-leaf px-5 py-4"
          onPress={() => (canFinish ? finish() : setStep(step + 1))}
        >
          <Text className="text-base font-bold text-white">{canFinish ? 'Build my plan' : 'Continue'}</Text>
          <Ionicons name="arrow-forward" size={18} color="white" />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Field({ label, ...props }) {
  return (
    <View>
      <Text className="mb-1 text-sm font-semibold text-slate-600">{label}</Text>
      <TextInput className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-base text-ink" {...props} />
    </View>
  );
}

function Choice({ active, label, onPress }) {
  return (
    <Pressable onPress={onPress} className="rounded-lg border px-4 py-3" style={{ borderColor: active ? '#16745b' : '#d7e2dd', backgroundColor: active ? '#e6f4ef' : '#fff' }}>
      <Text className="font-semibold capitalize" style={{ color: active ? '#16745b' : '#334155' }}>{label}</Text>
    </Pressable>
  );
}
