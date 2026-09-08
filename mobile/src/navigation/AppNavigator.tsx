import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MainTabNavigator } from './MainTabNavigator';
import { MeetingDetailScreen } from '../screens/meetings/MeetingDetailScreen';
import { MeetingRoomScreen } from '../screens/meetings/MeetingRoomScreen';
import { LivestreamListScreen } from '../screens/livestreams/LivestreamListScreen';
import { LivestreamViewerScreen } from '../screens/livestreams/LivestreamViewerScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen name="MeetingDetail" component={MeetingDetailScreen} />
      <Stack.Screen name="MeetingRoom" component={MeetingRoomScreen} />
      <Stack.Screen name="LivestreamList" component={LivestreamListScreen} />
      <Stack.Screen name="LivestreamViewer" component={LivestreamViewerScreen} />
    </Stack.Navigator>
  );
}
