import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { useAuth } from '../hooks/useAuth';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';

export function RootNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator color="#0ea5e9" />
      </View>
    );
  }

  return <NavigationContainer>{user ? <AppNavigator /> : <AuthNavigator />}</NavigationContainer>;
}
