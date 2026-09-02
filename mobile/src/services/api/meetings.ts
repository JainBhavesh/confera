import { apiFetch } from './client';
import type { Meeting, MeetingMessage } from '../../types';

export function listMeetings(): Promise<{ meetings: Meeting[] }> {
  return apiFetch('/api/meetings');
}

export function createMeeting(title: string): Promise<{ meeting: Meeting }> {
  return apiFetch('/api/meetings', { method: 'POST', body: JSON.stringify({ title }) });
}

export function getMeeting(id: string): Promise<{ meeting: Meeting }> {
  return apiFetch(`/api/meetings/${id}`);
}

export function joinMeeting(id: string): Promise<{ token: string; serverUrl: string; roomName: string; meeting: Meeting }> {
  return apiFetch(`/api/meetings/${id}/join`, { method: 'POST' });
}

export function leaveMeeting(id: string): Promise<void> {
  return apiFetch(`/api/meetings/${id}/leave`, { method: 'POST' });
}

export function listMeetingMessages(id: string): Promise<{ messages: MeetingMessage[] }> {
  return apiFetch(`/api/meetings/${id}/messages`);
}

export function sendMeetingMessage(id: string, message: string): Promise<{ message: MeetingMessage }> {
  return apiFetch(`/api/meetings/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
}
