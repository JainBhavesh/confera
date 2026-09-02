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
}

export interface Meeting {
  id: string;
  organizationId: string;
  createdByUserId: string;
  title: string;
  status: MeetingStatus;
  livekitRoomName: string;
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
