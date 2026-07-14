import { ImageBackground, Text, View } from 'react-native';

export default function RecipesScreen() {
  return (
    <ImageBackground source={require('../../assets/brand/tenafit-bg.png')} className="flex-1 px-5 pt-14" resizeMode="cover">
      <View className="absolute inset-0 bg-white/85" />
      <Text className="font-exo text-4xl text-ink">Recipes</Text>
      <View className="mt-6 rounded-3xl bg-white/95 p-5 shadow-xl shadow-black/10">
        <Text className="font-poppinsBold text-lg text-ink">Food details</Text>
        <Text className="mt-2 font-poppins text-sm leading-6 text-smoke">Open a meal card on Home to see ingredients, recipe notes, calories, protein, carbs, and fat.</Text>
      </View>
    </ImageBackground>
  );
}
