import { apiFetch } from './client';
import type { MeetingNotes } from '../../types';

export function getMeetingNotes(meetingId: string): Promise<{ notes: MeetingNotes | null }> {
  return apiFetch(`/api/meetings/${meetingId}/notes`);
}

export function generateMeetingNotes(meetingId: string): Promise<{ notes: MeetingNotes | null }> {
  return apiFetch(`/api/meetings/${meetingId}/generate-notes`, { method: 'POST' });
}
