import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { DashboardScreen } from '../screens/dashboard/DashboardScreen';
import { MeetingListScreen } from '../screens/meetings/MeetingListScreen';
import { ScheduleScreen } from '../screens/schedule/ScheduleScreen';
import { ActionItemsScreen } from '../screens/actions/ActionItemsScreen';
import { LibraryScreen } from '../screens/library/LibraryScreen';
import { BottomTabBar } from './BottomTabBar';
import type { AppTabParamList } from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();

export function MainTabNavigator() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <BottomTabBar {...props} />}>
      <Tab.Screen name="Home" component={DashboardScreen} options={{ title: t('tabs.home') }} />
      <Tab.Screen name="Meetings" component={MeetingListScreen} options={{ title: t('tabs.meetings') }} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} options={{ title: t('tabs.schedule') }} />
      <Tab.Screen name="Actions" component={ActionItemsScreen} options={{ title: t('tabs.actions') }} />
      <Tab.Screen name="Library" component={LibraryScreen} options={{ title: t('tabs.library') }} />
    </Tab.Navigator>
  );
}
