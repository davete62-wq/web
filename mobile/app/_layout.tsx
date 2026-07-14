import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ImageBackground, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Exo2_700Bold } from '@expo-google-fonts/exo-2';
import Animated, { FadeIn } from 'react-native-reanimated';
import '../global.css';
import { useAuthStore } from '../store/auth';

export default function RootLayout() {
  const hydrate = useAuthStore((state) => state.hydrate);
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold, Exo2_700Bold });

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (!fontsLoaded) {
    return (
      <ImageBackground source={require('../assets/brand/tenafit-bg.png')} className="flex-1 items-center justify-center">
        <View className="absolute inset-0 bg-white/70" />
        <Animated.View entering={FadeIn.duration(600)} className="h-12 w-12 rounded-full border-4 border-skyPulse border-t-freshGreen" />
      </ImageBackground>
    );
  }

  return (
    <GestureHandlerRootView className="flex-1">
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="verify" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}
