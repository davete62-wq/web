import { router } from 'expo-router';
import { useState } from 'react';
import { Image, ImageBackground, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import ScaleButton from '../components/ScaleButton';
import { useAuthStore } from '../store/auth';

function formatPhone(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  const local = digits.startsWith('251') ? digits.slice(3) : digits.replace(/^0/, '');
  return `+251 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 9)}`.trim();
}

export default function LoginScreen() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const phone = useAuthStore((state) => state.phone);
  const setPhone = useAuthStore((state) => state.setPhone);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const [localError, setLocalError] = useState<string | null>(null);
  const spin = useSharedValue(0);

  const spinnerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  if (hydrated && token) {
    router.replace('/(tabs)/diet');
    return null;
  }

  async function submit() {
    const digits = phone.replace(/[^0-9]/g, '');
    if (digits.length < 12) {
      setLocalError('Enter a valid Ethiopian phone number');
      return;
    }
    setLocalError(null);
    spin.value = withRepeat(withTiming(360, { duration: 900 }), -1, false);
    try {
      await sendOtp();
      router.push('/verify');
    } catch {
      spin.value = 0;
    }
  }

  return (
    <ImageBackground source={require('../assets/brand/tenafit-bg.png')} className="flex-1" resizeMode="cover">
      <View className="absolute inset-0 bg-white/75" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end px-5 pb-8 pt-14">
        <Animated.View entering={FadeInUp.duration(700)} className="items-center">
          <View className="h-40 w-48 items-center justify-center rounded-3xl bg-white/90 shadow-lg shadow-skyDeep/20">
            <Image source={require('../assets/brand/pulse-logo.jpg')} className="h-32 w-40" resizeMode="contain" />
          </View>
          <Text className="mt-5 font-exo text-5xl text-ink">TenaFit</Text>
          <Text className="mt-1 text-center font-poppinsSemi text-base tracking-[5px] text-skyDeep">WELLNESS HUB</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).duration(700)} className="mt-10 rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-black/10">
          <Text className="font-poppinsBold text-2xl text-ink">Phone verification</Text>
          <Text className="mt-2 font-poppins text-sm leading-6 text-smoke">Train hard, eat with intention, and keep your Ethiopian diet plan synced to your profile.</Text>

          <View className="mt-5">
            <Text className="mb-2 font-poppinsSemi text-sm text-ink">Phone number</Text>
            <View className={`flex-row items-center rounded-2xl border bg-softBeige/70 px-4 ${localError || error ? 'border-danger' : 'border-sand'}`}>
              <Ionicons name="call" size={20} color="#0284c7" />
              <View className="ml-3 h-14 justify-center border-r border-sand pr-3">
                <Text className="font-poppinsBold text-base text-ink">+251</Text>
              </View>
              <TextInput
                value={phone.replace(/^\+251\s?/, '')}
                onChangeText={(value) => setPhone(formatPhone(value))}
                keyboardType="phone-pad"
                className="ml-3 h-14 flex-1 font-poppinsSemi text-base text-ink"
                placeholder="912 345 678"
                placeholderTextColor="#94a3b8"
                maxLength={11}
              />
            </View>
            {!!(localError || error) && <Text className="mt-2 font-poppinsSemi text-sm text-danger">{localError ?? error}</Text>}
          </View>

          <ScaleButton disabled={loading} onPress={submit} className="mt-6 h-14 flex-row items-center justify-center rounded-2xl bg-skyPulse shadow-lg shadow-skyDeep/30">
            {loading && <Animated.View style={spinnerStyle} className="mr-3 h-5 w-5 rounded-full border-2 border-white border-t-freshGreen" />}
            <Text className="font-poppinsBold text-base text-white">Send OTP</Text>
          </ScaleButton>
        </Animated.View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
