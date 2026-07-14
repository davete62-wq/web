import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, ImageBackground, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { fetchProfile, hasCompletedProfile } from '../services/api';
import { useAuthStore } from '../store/auth';

type Destination = '/login' | '/(tabs)/diet' | '/(tabs)/profile' | null;

export default function Index() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [destination, setDestination] = useState<Destination>(null);

  useEffect(() => {
    let cancelled = false;

    async function routeAfterSplash() {
      if (!hydrated) return;
      await new Promise((resolve) => setTimeout(resolve, 900));
      if (cancelled) return;
      if (!token) {
        setDestination('/login');
        return;
      }

      try {
        const profile = await fetchProfile();
        if (!cancelled) setDestination(hasCompletedProfile(profile) ? '/(tabs)/diet' : '/(tabs)/profile');
      } catch {
        if (!cancelled) setDestination('/(tabs)/profile');
      }
    }

    routeAfterSplash();
    return () => {
      cancelled = true;
    };
  }, [hydrated, token]);

  if (destination) return <Redirect href={destination} />;

  return (
    <ImageBackground source={require('../assets/brand/tenafit-bg.png')} className="flex-1 items-center justify-center" resizeMode="cover">
      <View className="absolute inset-0 bg-white/85" />
      <Animated.View entering={FadeIn.duration(300)} className="items-center">
        <Image source={require('../assets/brand/pulse-logo.jpg')} className="h-48 w-64" resizeMode="contain" />
        <Text className="mt-4 font-exo text-5xl text-ink">TenaFit</Text>
        <Text className="mt-2 font-poppinsSemi text-sm uppercase tracking-[4px] text-skyDeep">Made by Pulse Gym</Text>
        <View className="mt-8 h-3 w-32 overflow-hidden rounded-full bg-softBeige">
          <Animated.View entering={FadeIn.delay(200).duration(400)} className="h-full w-20 rounded-full bg-freshGreen" />
        </View>
      </Animated.View>
    </ImageBackground>
  );
}
