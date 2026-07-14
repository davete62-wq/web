import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ImageBackground, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import ScaleButton from '../components/ScaleButton';
import { fetchProfile, hasCompletedProfile } from '../services/api';
import { useAuthStore } from '../store/auth';

export default function VerifyScreen() {
  const inputRef = useRef<TextInput>(null);
  const phone = useAuthStore((state) => state.phone);
  const verify = useAuthStore((state) => state.verify);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const spin = useSharedValue(0);
  const spinnerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  async function submit() {
    if (code.length < 4) {
      setLocalError('Invalid Code');
      return;
    }
    setLocalError(null);
    spin.value = withRepeat(withTiming(360, { duration: 900 }), -1, false);
    try {
      await verify(code);
      try {
        const profile = await fetchProfile();
        router.replace(hasCompletedProfile(profile) ? '/(tabs)/diet' : '/(tabs)/profile');
      } catch {
        router.replace('/(tabs)/profile');
      }
    } catch {
      setLocalError('Invalid Code');
      spin.value = 0;
    }
  }

  return (
    <ImageBackground source={require('../assets/brand/tenafit-bg.png')} className="flex-1 justify-end px-5 pb-8" resizeMode="cover">
      <View className="absolute inset-0 bg-white/80" />
      <Animated.View entering={FadeInDown.duration(650)} className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-black/10">
        <Text className="font-exo text-4xl text-ink">Verify OTP</Text>
        <Text className="mt-2 font-poppins text-sm leading-6 text-smoke">Enter the code sent to {phone}. Your secure plan unlocks after verification.</Text>

        <TextInput
          ref={inputRef}
          value={code}
          onChangeText={(value) => setCode(value.replace(/[^0-9]/g, '').slice(0, 6))}
          keyboardType="number-pad"
          maxLength={6}
          className={`mt-6 h-16 rounded-2xl border bg-softBeige/70 text-center font-exo text-3xl tracking-[10px] text-ink ${localError || error ? 'border-danger' : 'border-sand'}`}
          placeholder=""
          placeholderTextColor="#94a3b8"
        />
        {!!(localError || error) && <Text className="mt-2 font-poppinsSemi text-sm text-danger">{localError ?? error}</Text>}

        <ScaleButton disabled={loading} onPress={submit} className="mt-6 h-14 flex-row items-center justify-center rounded-2xl bg-freshGreen shadow-lg shadow-freshDeep/30">
          {loading && <Animated.View style={spinnerStyle} className="mr-3 h-5 w-5 rounded-full border-2 border-white border-t-skyPulse" />}
          <Text className="font-poppinsBold text-base text-white">Verify</Text>
        </ScaleButton>
        <ScaleButton onPress={() => router.back()} className="mt-3 h-12 items-center justify-center rounded-xl bg-softBeige">
          <Text className="font-poppinsSemi text-sm text-ink">Change phone number</Text>
        </ScaleButton>
      </Animated.View>
    </ImageBackground>
  );
}
