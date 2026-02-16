import { Redirect } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#FD5B00" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)" />;
}