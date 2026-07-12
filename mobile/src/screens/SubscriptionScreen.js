import { ImageBackground, Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SubscriptionScreen({ navigation }) {
  return (
    <View className="flex-1 bg-mist">
      <ImageBackground source={require('../../assets/ethiopia-hero.png')} className="h-[360px] justify-end px-6 pb-8">
        <Text className="text-4xl font-bold text-white">Goal reached</Text>
        <Text className="mt-2 max-w-[310px] text-base font-medium text-white">
          Keep the momentum with a maintenance plan or a new target.
        </Text>
      </ImageBackground>
      <View className="px-5 pt-6">
        <View className="rounded-lg bg-white p-5">
          <View className="flex-row items-center gap-3">
            <Ionicons name="sparkles" size={24} color="#e85d2a" />
            <Text className="text-xl font-bold text-ink">Personalized next goal</Text>
          </View>
          <Text className="mt-3 text-slate-600">
            Subscribe to refresh calories, meals, and weekly targets as your body changes.
          </Text>
        </View>
        <Pressable className="mt-6 rounded-lg bg-leaf px-5 py-4" onPress={() => navigation.replace('Dashboard')}>
          <Text className="text-center text-base font-bold text-white">Choose my new plan</Text>
        </Pressable>
      </View>
    </View>
  );
}
