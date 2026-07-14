import { ImageBackground, Text, View } from 'react-native';

export default function ProgressScreen() {
  return (
    <ImageBackground source={require('../../assets/brand/tenafit-bg.png')} className="flex-1 px-5 pt-14" resizeMode="cover">
      <View className="absolute inset-0 bg-white/85" />
      <Text className="font-exo text-4xl text-ink">Progress</Text>
      <View className="mt-6 rounded-3xl bg-white/95 p-5 shadow-xl shadow-black/10">
        <Text className="font-poppinsBold text-lg text-ink">Weekly check-in</Text>
        <Text className="mt-2 font-poppins text-sm leading-6 text-smoke">Your saved weight, target calories, and streak data are stored on the server account and update the next plan.</Text>
      </View>
    </ImageBackground>
  );
}
