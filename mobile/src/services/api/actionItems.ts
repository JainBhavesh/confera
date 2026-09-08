import { apiFetch } from './client';
import type { ActionItem, ActionItemStatus } from '../../types';

export interface ListActionItemsParams {
  meetingId?: string;
  status?: ActionItemStatus;
  scope?: 'assigned' | 'created' | 'all';
}

export function listActionItems(params: ListActionItemsParams = {}): Promise<{ actionItems: ActionItem[] }> {
  const query = new URLSearchParams();
  if (params.meetingId) query.set('meetingId', params.meetingId);
  if (params.status) query.set('status', params.status);
  if (params.scope) query.set('scope', params.scope);
  const qs = query.toString();
  return apiFetch(`/api/action-items${qs ? `?${qs}` : ''}`);
}

export function updateActionItem(
  id: string,
  patch: Partial<Pick<ActionItem, 'status' | 'title' | 'description' | 'dueDate' | 'assignedToUserId'>>
): Promise<{ actionItem: ActionItem }> {
  return apiFetch(`/api/action-items/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
}
