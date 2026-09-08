import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { MeetingListScreen } from '../screens/meetings/MeetingListScreen';
import { ScheduleScreen } from '../screens/schedule/ScheduleScreen';
import { ActionItemsScreen } from '../screens/actions/ActionItemsScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { BottomTabBar } from './BottomTabBar';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function MainTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Meetings" component={MeetingListScreen} options={{ title: 'Meetings' }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Actions" component={ActionItemsScreen} options={{ title: 'Actions' }} />
      <Tab.Screen name="Library" component={LibraryScreen} />
    </Tab.Navigator>
  );
}
