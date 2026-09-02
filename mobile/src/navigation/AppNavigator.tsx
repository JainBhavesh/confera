import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { MeetingListScreen } from '../screens/meetings/MeetingListScreen';
import { MeetingRoomScreen } from '../screens/meetings/MeetingRoomScreen';
import { LivestreamListScreen } from '../screens/livestreams/LivestreamListScreen';
import { LivestreamViewerScreen } from '../screens/livestreams/LivestreamViewerScreen';
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import type { AppStackParamList } from './types';

const Stack = createNativeStackNavigator<AppStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: '#0f172a' },
  headerTintColor: '#fff',
  headerShadowVisible: false
};

export function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="MeetingList" component={MeetingListScreen} options={{ title: 'Meetings' }} />
      <Stack.Screen name="MeetingRoom" component={MeetingRoomScreen} options={{ title: 'Meeting' }} />
      <Stack.Screen name="LivestreamList" component={LivestreamListScreen} options={{ title: 'Livestreams' }} />
      <Stack.Screen name="LivestreamViewer" component={LivestreamViewerScreen} options={{ title: 'Livestream' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
