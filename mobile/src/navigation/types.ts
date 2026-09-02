export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AppStackParamList = {
  Dashboard: undefined;
  MeetingList: undefined;
  MeetingRoom: { meetingId: string };
  LivestreamList: undefined;
  LivestreamViewer: { livestreamId: string };
  Profile: undefined;
};
