import { apiFetch } from './client';
import type { Livestream, LivestreamMessage } from '../../types';

// Mobile is viewer-only for livestreams — hosting/broadcasting is web-only for now.

export function listLivestreams(): Promise<{ livestreams: Livestream[] }> {
  return apiFetch('/api/livestreams');
}

export function joinLivestream(id: string): Promise<{ token: string; serverUrl: string; roomName: string; livestream: Livestream }> {
  return apiFetch(`/api/livestreams/${id}/join`, { method: 'POST' });
}

export function listLivestreamMessages(id: string): Promise<{ messages: LivestreamMessage[] }> {
  return apiFetch(`/api/livestreams/${id}/messages`);
}

export function sendLivestreamMessage(id: string, message: string): Promise<{ message: LivestreamMessage }> {
  return apiFetch(`/api/livestreams/${id}/messages`, { method: 'POST', body: JSON.stringify({ message }) });
}
