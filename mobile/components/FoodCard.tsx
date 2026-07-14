import { ImageBackground, Modal, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import ScaleButton from './ScaleButton';

export type FoodItem = {
  id?: string | number;
  name: string;
  mealType?: string;
  group?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingGrams?: number;
  recipe?: string;
  ingredients?: string[];
};

const foodImages = {
  wot: require('../assets/brand/tenafit-bg.png'),
  stew: require('../assets/brand/tenafit-bg.png'),
  shiro: require('../assets/brand/tenafit-bg.png'),
  doro: require('../assets/brand/tenafit-bg.png'),
  injera: require('../assets/brand/tenafit-bg.png'),
  default: require('../assets/brand/tenafit-bg.png')
};

export function resolveFoodImage(food: FoodItem) {
  const key = `${food.mealType ?? ''} ${food.name ?? ''} ${food.group ?? ''}`.toLowerCase();
  if (key.includes('doro') || key.includes('doro wot')) return foodImages.doro;
  if (key.includes('shiro') || key.includes('shiro wot')) return foodImages.shiro;
  if (key.includes('wot') || key.includes('wat')) return foodImages.wot;
  if (key.includes('stew')) return foodImages.stew;
  if (key.includes('injera')) return foodImages.injera;
  return foodImages.default;
}

export default function FoodCard({ food, onPress }: { food: FoodItem; onPress: () => void }) {
  const image = resolveFoodImage(food);
  return (
    <ScaleButton onPress={onPress} className="overflow-hidden rounded-3xl bg-white shadow-lg shadow-black/10">
      <ImageBackground source={image} className="h-44 justify-end overflow-hidden" resizeMode="cover">
        <View className="absolute inset-0 bg-black/25" />
        <View className="p-4">
          <Text className="font-exo text-2xl text-white" numberOfLines={1}>{food.name}</Text>
          <Text className="mt-1 font-poppinsSemi text-xs uppercase tracking-[2px] text-softBeige">{food.mealType ?? food.group ?? 'TenaFit fuel'}</Text>
        </View>
      </ImageBackground>
      <View className="gap-3 p-4">
        <View className="flex-row items-center justify-between">
          <Macro label="Protein" value={food.protein ?? 0} color="text-skyDeep" />
          <Macro label="Carbs" value={food.carbs ?? 0} color="text-freshDeep" />
          <Macro label="Fats" value={food.fat ?? 0} color="text-orange-500" />
        </View>
        <View className="flex-row items-center justify-between rounded-2xl bg-softBeige px-4 py-3">
          <Text className="font-poppinsSemi text-sm text-ink">Serving</Text>
          <Text className="font-poppinsBold text-sm text-ink">{food.servingGrams ?? 100}g • {food.calories ?? 0} cal</Text>
        </View>
      </View>
    </ScaleButton>
  );
}

function Macro({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View className="items-center">
      <Text className={`font-exo text-xl ${color}`}>{Math.round(value)}g</Text>
      <Text className="font-poppins text-xs text-smoke">{label}</Text>
    </View>
  );
}

export function FoodDetailSheet({ food, visible, onClose }: { food: FoodItem | null; visible: boolean; onClose: () => void }) {
  if (!food) return null;
  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} className="flex-1 justify-end bg-black/45">
        <Animated.View entering={SlideInDown.springify().damping(18)} exiting={SlideOutDown.duration(220)} className="rounded-t-[32px] bg-white p-5">
          <View className="mx-auto mb-4 h-1.5 w-14 rounded-full bg-sand" />
          <View className="flex-row items-start justify-between gap-4">
            <View className="flex-1">
              <Text className="font-exo text-3xl text-ink">{food.name}</Text>
              <Text className="mt-2 font-poppins text-sm leading-6 text-smoke">{food.recipe ?? 'Balanced Ethiopian performance meal selected for today’s macro target.'}</Text>
            </View>
            <ScaleButton onPress={onClose} className="h-11 w-11 items-center justify-center rounded-full bg-softBeige">
              <Ionicons name="close" size={22} color="#111827" />
            </ScaleButton>
          </View>
          <View className="mt-5 flex-row gap-3">
            <Pill label="Protein" value={`${Math.round(food.protein ?? 0)}g`} />
            <Pill label="Carbs" value={`${Math.round(food.carbs ?? 0)}g`} />
            <Pill label="Fats" value={`${Math.round(food.fat ?? 0)}g`} />
          </View>
          <View className="mt-5 rounded-3xl bg-softBeige p-4">
            <Text className="font-poppinsBold text-base text-ink">Ingredients</Text>
            <Text className="mt-2 font-poppins text-sm leading-6 text-smoke">{food.ingredients?.join(', ') || 'EFCT food item, measured serving, clean prep notes, and hydration.'}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-2xl bg-skyPulse/10 p-3">
      <Text className="font-poppins text-xs text-smoke">{label}</Text>
      <Text className="font-exo text-xl text-skyDeep">{value}</Text>
    </View>
  );
}
