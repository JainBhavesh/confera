import { describe, expect, it, vi, beforeEach } from 'vitest';

const { findUniqueOrThrow, upsert, update, actionItemDeleteMany, actionItemCreateMany } = vi.hoisted(() => ({
  findUniqueOrThrow: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn(),
  actionItemDeleteMany: vi.fn(),
  actionItemCreateMany: vi.fn()
}));

const { waitForRecordingToFinish } = vi.hoisted(() => ({ waitForRecordingToFinish: vi.fn() }));

const { s3Send } = vi.hoisted(() => ({ s3Send: vi.fn() }));

const { readFile } = vi.hoisted(() => ({ readFile: vi.fn() }));

const { processRecording } = vi.hoisted(() => ({ processRecording: vi.fn() }));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    meeting: { findUniqueOrThrow },
    meetingNotes: { upsert, update },
    actionItem: { deleteMany: actionItemDeleteMany, createMany: actionItemCreateMany }
  }
}));

vi.mock('@/services/egress.service', () => ({
  recordingObjectKey: (meeting: { livekitRoomName: string }) => `${meeting.livekitRoomName}.ogg`,
  waitForRecordingToFinish,
  EgressStatus: { EGRESS_COMPLETE: 3, EGRESS_FAILED: 4, EGRESS_ABORTED: 5 }
}));

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    send = s3Send;
  },
  GetObjectCommand: class {
    constructor(public input: unknown) {}
  }
}));

// Recordings default to local-disk storage (RECORDING_STORAGE_MODE=local),
// so the transcription flow reads the recording via fs/promises.readFile
// rather than S3 by default.
vi.mock('fs/promises', () => ({ readFile }));

vi.mock('@/services/aiNotes.client', () => ({ processRecording }));

const { generateMeetingNotes } = await import('./meetingNotes.service');

describe('generateMeetingNotes', () => {
  beforeEach(() => {
    findUniqueOrThrow.mockReset();
    upsert.mockReset();
    update.mockReset();
    actionItemDeleteMany.mockReset().mockResolvedValue({ count: 0 });
    actionItemCreateMany.mockReset().mockResolvedValue({ count: 0 });
    waitForRecordingToFinish.mockReset();
    s3Send.mockReset();
    readFile.mockReset();
    processRecording.mockReset();
  });

  it('skips transcription and marks notes SKIPPED when there is no recording', async () => {
    findUniqueOrThrow.mockResolvedValue({ id: 'meeting-1', livekitRoomName: 'room-1', egressId: null });

    await generateMeetingNotes('meeting-1');

    expect(waitForRecordingToFinish).not.toHaveBeenCalled();
    expect(processRecording).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { meetingId: 'meeting-1' }, create: expect.objectContaining({ status: 'SKIPPED' }) })
    );
  });

  it('marks notes READY with the transcript and summary, and writes action items as ActionItem rows', async () => {
    findUniqueOrThrow.mockResolvedValue({ id: 'meeting-1', organizationId: 'org-1', livekitRoomName: 'room-1', egressId: 'EG_1' });
    waitForRecordingToFinish.mockResolvedValue(3); // EGRESS_COMPLETE
    readFile.mockResolvedValue(Buffer.from('fake-audio-bytes'));
    processRecording.mockResolvedValue({
      transcript: 'We shipped the feature.',
      summary: 'Shipped the feature.',
      actionItems: [{ text: 'Deploy', owner: 'Alice' }]
    });

    await generateMeetingNotes('meeting-1');

    expect(update).toHaveBeenCalledWith({
      where: { meetingId: 'meeting-1' },
      data: expect.objectContaining({
        status: 'READY',
        transcript: 'We shipped the feature.',
        summary: 'Shipped the feature.'
      })
    });
    expect(actionItemDeleteMany).toHaveBeenCalledWith({ where: { meetingId: 'meeting-1', source: 'AI' } });
    expect(actionItemCreateMany).toHaveBeenCalledWith({
      data: [{ organizationId: 'org-1', meetingId: 'meeting-1', title: 'Deploy', source: 'AI' }]
    });
  });

  it('marks notes FAILED when the recording never completes', async () => {
    findUniqueOrThrow.mockResolvedValue({ id: 'meeting-1', livekitRoomName: 'room-1', egressId: 'EG_1' });
    waitForRecordingToFinish.mockResolvedValue(4); // EGRESS_FAILED

    await generateMeetingNotes('meeting-1');

    expect(processRecording).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { meetingId: 'meeting-1' },
      data: expect.objectContaining({ status: 'FAILED' })
    });
  });
});
