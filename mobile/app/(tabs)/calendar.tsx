import { ImageBackground, Text, View } from 'react-native';

export default function CalendarScreen() {
  return (
    <ImageBackground source={require('../../assets/brand/tenafit-bg.png')} className="flex-1 px-5 pt-14" resizeMode="cover">
      <View className="absolute inset-0 bg-white/85" />
      <Text className="font-exo text-4xl text-ink">Calendar</Text>
      <View className="mt-6 rounded-3xl bg-white/95 p-5 shadow-xl shadow-black/10">
        <Text className="font-poppinsBold text-lg text-ink">Current week</Text>
        <Text className="mt-2 font-poppins text-sm leading-6 text-smoke">The backend keeps one food plan per user per day, so this page can show the current week from /meal-plans/current-week.</Text>
      </View>
    </ImageBackground>
  );
}
