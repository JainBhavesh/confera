// LiveKit React Native meeting room integration.
//
// Token flow, per the architecture the web app already implements (see
// services/api/meetings.ts#joinMeeting and the web project's
// lib/livekit/token.ts): the server mints the token and the client never
// sees the LiveKit API secret. MeetingRoomScreen calls joinMeeting(meetingId)
// to get { token, serverUrl } and passes them straight to <LiveKitRoom>.
//
// registerGlobals() (from '@livekit/react-native') is called once at app
// startup in mobile/index.ts — it must run before any LiveKit/WebRTC API is
// touched, so nothing in this module (or anything it imports) may run before
// that point.

// Data-channel topic used for meeting chat — must match the web app's
// ChatPanel (components/meeting/ChatPanel.tsx) so messages broadcast to
// participants on either platform.
export const CHAT_DATA_TOPIC = 'chat';
