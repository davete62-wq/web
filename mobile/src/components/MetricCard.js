import { Text, View } from 'react-native';

export default function MetricCard({ label, value, accent }) {
  return (
    <View className="flex-1 rounded-lg border border-slate-200 bg-white p-4">
      <Text className="text-sm font-medium text-slate-500">{label}</Text>
      <Text className="mt-2 text-2xl font-bold text-ink" style={accent ? { color: accent } : null}>
        {value}
      </Text>
    </View>
  );
}
