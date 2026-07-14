import { router } from 'expo-router';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect, useState } from 'react';
import { ImageBackground, KeyboardAvoidingView, Platform, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import ScaleButton from '../components/ScaleButton';
import { fetchProfile, hasCompletedProfile } from '../services/api';
import { useAuthStore } from '../store/auth';

WebBrowser.maybeCompleteAuthSession();

function formatPhone(value: string) {
  const digits = value.replace(/[^0-9]/g, '');
  const local = digits.startsWith('251') ? digits.slice(3) : digits.replace(/^0/, '');
  return `+251 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 9)}`.trim();
}

async function routeAfterAuth() {
  try {
    const profile = await fetchProfile();
    router.replace(hasCompletedProfile(profile) ? '/(tabs)/diet' : '/(tabs)/profile');
  } catch {
    router.replace('/(tabs)/profile');
  }
}

export default function LoginScreen() {
  const token = useAuthStore((state) => state.token);
  const hydrated = useAuthStore((state) => state.hydrated);
  const phone = useAuthStore((state) => state.phone);
  const setPhone = useAuthStore((state) => state.setPhone);
  const sendOtp = useAuthStore((state) => state.sendOtp);
  const googleSignIn = useAuthStore((state) => state.googleSignIn);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const [localError, setLocalError] = useState<string | null>(null);
  const spin = useSharedValue(0);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID
  });

  const spinnerStyle = useAnimatedStyle(() => ({ transform: [{ rotate: `${spin.value}deg` }] }));

  useEffect(() => {
    if (hydrated && token) routeAfterAuth();
  }, [hydrated, token]);

  useEffect(() => {
    async function finishGoogle() {
      if (response?.type !== 'success') return;
      const idToken = response.authentication?.idToken;
      if (!idToken) {
        setLocalError('Google did not return an ID token. Check the Google client ID setup.');
        return;
      }

      try {
        await googleSignIn(idToken);
        await routeAfterAuth();
      } catch {
        setLocalError('Google sign-in failed. Check the server Google client ID.');
      }
    }

    finishGoogle();
  }, [response, googleSignIn]);

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

  async function submitGoogle() {
    setLocalError(null);
    if (!request) {
      setLocalError('Google sign-in is not configured in the APK yet.');
      return;
    }
    await promptAsync();
  }

  return (
    <ImageBackground source={require('../assets/brand/tenafit-bg.png')} className="flex-1" resizeMode="cover">
      <View className="absolute inset-0 bg-white/78" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={18} className="flex-1 justify-center px-5 pb-16 pt-10">
        <Animated.View entering={FadeInDown.duration(650)} className="rounded-3xl border border-white/80 bg-white/95 p-5 shadow-xl shadow-black/10">
          <Text className="font-exo text-4xl text-ink">Sign in</Text>
          <Text className="mt-2 font-poppins text-sm leading-6 text-smoke">Use phone OTP or Google. Your saved account controls your profile and daily food plan.</Text>

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

          <ScaleButton disabled={loading} onPress={submitGoogle} className="mt-3 h-14 flex-row items-center justify-center rounded-2xl border border-sand bg-white">
            <Ionicons name="logo-google" size={20} color="#111827" />
            <Text className="ml-2 font-poppinsBold text-base text-ink">Sign in with Google</Text>
          </ScaleButton>
        </Animated.View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
