import { View } from 'react-native';

export default function ProgressBar({ value, max, color = '#16745b' }) {
  const width = `${Math.min(100, Math.max(0, (value / max) * 100))}%`;
  return (
    <View className="h-3 overflow-hidden rounded-full bg-slate-200">
      <View className="h-full rounded-full" style={{ width, backgroundColor: color }} />
    </View>
  );
}
