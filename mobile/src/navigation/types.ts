import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppTabParamList = {
  Home: undefined;
  Meetings: undefined;
  Schedule: undefined;
  Actions: undefined;
  Library: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  MeetingDetail: { meetingId: string };
  MeetingRoom: { meetingId: string };
  LivestreamList: undefined;
  LivestreamViewer: { livestreamId: string };
};

// A screen rendered inside a bottom tab needs both its own tab's params and
// the parent stack's — e.g. tapping a meeting on the "Meetings" tab pushes
// "MeetingDetail", which lives one level up in AppStackParamList.
export type TabScreenProps<T extends keyof AppTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<AppTabParamList, T>,
  NativeStackScreenProps<AppStackParamList>
>;
