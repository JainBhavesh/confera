import { describe, expect, it } from 'vitest';
import { generateLiveKitRoomName } from './roomUtils';

describe('generateLiveKitRoomName', () => {
  it('embeds the organization id but is not a predictable name like "room-1"', () => {
    const name = generateLiveKitRoomName('org-123');
    expect(name).toMatch(/^org_org-123_meeting_[0-9a-f]{24}$/);
  });

  it('is not guessable — two calls for the same org never collide', () => {
    const a = generateLiveKitRoomName('org-123');
    const b = generateLiveKitRoomName('org-123');
    expect(a).not.toBe(b);
  });

  it('has enough random entropy that sequential calls are not incrementing/predictable', () => {
    const names = Array.from({ length: 20 }, () => generateLiveKitRoomName('org-123'));
    expect(new Set(names).size).toBe(names.length);
  });
});
