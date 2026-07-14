import { Image, ImageBackground, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import ScaleButton from '../../components/ScaleButton';
import { useAuthStore } from '../../store/auth';

export default function ProfileScreen() {
  const logout = useAuthStore((state) => state.logout);
  async function signOut() {
    await logout();
    router.replace('/login');
  }

  return (
    <ImageBackground source={require('../../assets/brand/tenafit-bg.png')} className="flex-1 px-5 pt-14" resizeMode="cover">
      <View className="absolute inset-0 bg-white/85" />
      <View className="items-center">
        <Image source={require('../../assets/brand/pulse-logo.jpg')} className="h-32 w-44" resizeMode="contain" />
        <Text className="mt-4 text-center font-exo text-4xl text-ink">Pulse Fitness</Text>
        <Text className="mt-2 text-center font-poppins text-sm leading-6 text-smoke">Sky blue focus, fresh green progress, and soft beige calm for a serious TenaFit routine.</Text>
      </View>
      <View className="mt-8 rounded-3xl bg-white/95 p-5 shadow-xl shadow-black/10">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-skyPulse/15">
            <Ionicons name="shield-checkmark" size={24} color="#0284c7" />
          </View>
          <View className="ml-4 flex-1">
            <Text className="font-poppinsBold text-lg text-ink">Secure wellness profile</Text>
            <Text className="font-poppins text-sm text-smoke">JWT stored with SecureStore.</Text>
          </View>
        </View>
        <ScaleButton onPress={signOut} className="mt-6 h-14 items-center justify-center rounded-2xl bg-ink">
          <Text className="font-poppinsBold text-base text-white">Log out</Text>
        </ScaleButton>
      </View>
    </ImageBackground>
  );
}
