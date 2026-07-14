import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Image, ImageBackground, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import ScaleButton from '../components/ScaleButton';
import { useAuthStore } from '../store/auth';

export default function Index() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const [language, setLanguage] = useState<string | null>(null);

  if (!hydrated) {
    return (
      <ImageBackground source={require('../assets/brand/tenafit-bg.png')} className="flex-1 items-center justify-center" resizeMode="cover">
        <View className="absolute inset-0 bg-white/85" />
        <Animated.View entering={FadeIn.duration(300)} className="items-center">
          <Image source={require('../assets/brand/pulse-logo.jpg')} className="h-40 w-52" resizeMode="contain" />
          <Text className="mt-4 font-exo text-4xl text-ink">TenaFit</Text>
        </Animated.View>
      </ImageBackground>
    );
  }

  if (token) return <Redirect href="/(tabs)/diet" />;
  if (language) return <Redirect href="/login" />;

  return (
    <ImageBackground source={require('../assets/brand/tenafit-bg.png')} className="flex-1 justify-end px-5 pb-10" resizeMode="cover">
      <View className="absolute inset-0 bg-white/85" />
      <Animated.View entering={FadeIn.duration(300)} className="items-center">
        <Image source={require('../assets/brand/pulse-logo.jpg')} className="h-44 w-56" resizeMode="contain" />
        <Text className="mt-3 font-exo text-5xl text-ink">TenaFit</Text>
        <Text className="mt-1 font-poppinsSemi text-sm uppercase tracking-[4px] text-skyDeep">Made by Pulse Gym</Text>
      </Animated.View>
      <View className="mt-10 flex-row gap-3">
        <ScaleButton onPress={() => setLanguage('en')} className="h-16 flex-1 items-center justify-center rounded-2xl bg-skyPulse">
          <Text className="font-poppinsBold text-base text-white">English</Text>
        </ScaleButton>
        <ScaleButton onPress={() => setLanguage('am')} className="h-16 flex-1 items-center justify-center rounded-2xl bg-freshGreen">
          <Text className="font-poppinsBold text-base text-white">Amharic</Text>
        </ScaleButton>
      </View>
    </ImageBackground>
  );
}
