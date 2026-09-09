export type Role = 'ADMIN' | 'USER';

export type MeetingStatus = 'SCHEDULED' | 'LIVE' | 'ENDED' | 'CANCELLED';

export interface PublicUser {
  id: string;
  organizationId: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  locale: string;
}

export type RecordingStatus = 'NONE' | 'RECORDING' | 'PROCESSING' | 'READY' | 'FAILED';

export interface Meeting {
  id: string;
  organizationId: string;
  createdByUserId: string;
  title: string;
  status: MeetingStatus;
  livekitRoomName: string;
  recordingStatus?: RecordingStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string };
}

export interface MeetingMessage {
  id: string;
  meetingId: string;
  userId: string;
  message: string;
  createdAt: string;
  user?: { id: string; name: string };
}

export type MeetingNotesStatus = 'PENDING' | 'READY' | 'FAILED' | 'SKIPPED';

export interface MeetingNotes {
  id: string;
  meetingId: string;
  status: MeetingNotesStatus;
  transcript: string | null;
  summary: string | null;
  error: string | null;
  generatedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ActionItemStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type ActionItemSource = 'MANUAL' | 'AI';

export interface ActionItem {
  id: string;
  organizationId: string;
  meetingId: string;
  assignedToUserId: string | null;
  createdByUserId: string | null;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: ActionItemStatus;
  source: ActionItemSource;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  meeting?: { id: string; title: string };
  assignedTo?: { id: string; name: string } | null;
}

export type LivestreamStatus = 'SCHEDULED' | 'LIVE' | 'ENDED';

export interface Livestream {
  id: string;
  organizationId: string;
  createdByUserId: string;
  title: string;
  status: LivestreamStatus;
  livekitRoomName: string;
  startedAt: string | null;
  endedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { name: string };
}

export interface LivestreamMessage {
  id: string;
  livestreamId: string;
  userId: string;
  message: string;
  createdAt: string;
  user?: { id: string; name: string };
}
