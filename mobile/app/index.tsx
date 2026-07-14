import { Redirect } from 'expo-router';
import { useAuthStore } from '../store/auth';

export default function Index() {
  const token = useAuthStore((state) => state.token);
  return <Redirect href={token ? '/(tabs)/diet' : '/login'} />;
}
