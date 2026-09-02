import { describe, expect, it, vi, beforeEach } from 'vitest';

const { findUniqueOrThrow, upsert, update } = vi.hoisted(() => ({
  findUniqueOrThrow: vi.fn(),
  upsert: vi.fn(),
  update: vi.fn()
}));

const { waitForRecordingToFinish } = vi.hoisted(() => ({ waitForRecordingToFinish: vi.fn() }));

const { s3Send } = vi.hoisted(() => ({ s3Send: vi.fn() }));

const { transcriptionsCreate, chatParse } = vi.hoisted(() => ({
  transcriptionsCreate: vi.fn(),
  chatParse: vi.fn()
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: { meeting: { findUniqueOrThrow }, meetingNotes: { upsert, update } }
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

vi.mock('openai', () => ({
  default: class {
    audio = { transcriptions: { create: transcriptionsCreate } };
    chat = { completions: { parse: chatParse } };
  },
  toFile: vi.fn(async (buffer: Buffer) => buffer)
}));

vi.mock('openai/helpers/zod', () => ({
  zodResponseFormat: () => ({})
}));

const { generateMeetingNotes } = await import('./meetingNotes.service');

function bodyStream(): AsyncIterable<Buffer> {
  return {
    async *[Symbol.asyncIterator]() {
      yield Buffer.from('fake-audio-bytes');
    }
  };
}

describe('generateMeetingNotes', () => {
  beforeEach(() => {
    findUniqueOrThrow.mockReset();
    upsert.mockReset();
    update.mockReset();
    waitForRecordingToFinish.mockReset();
    s3Send.mockReset();
    transcriptionsCreate.mockReset();
    chatParse.mockReset();
  });

  it('skips transcription and marks notes SKIPPED when there is no recording', async () => {
    findUniqueOrThrow.mockResolvedValue({ id: 'meeting-1', livekitRoomName: 'room-1', egressId: null });

    await generateMeetingNotes('meeting-1');

    expect(waitForRecordingToFinish).not.toHaveBeenCalled();
    expect(transcriptionsCreate).not.toHaveBeenCalled();
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ where: { meetingId: 'meeting-1' }, create: expect.objectContaining({ status: 'SKIPPED' }) })
    );
  });

  it('marks notes READY with the transcript, summary, and action items on success', async () => {
    findUniqueOrThrow.mockResolvedValue({ id: 'meeting-1', livekitRoomName: 'room-1', egressId: 'EG_1' });
    waitForRecordingToFinish.mockResolvedValue(3); // EGRESS_COMPLETE
    s3Send.mockResolvedValue({ Body: bodyStream() });
    transcriptionsCreate.mockResolvedValue({ text: 'We shipped the feature.' });
    chatParse.mockResolvedValue({
      choices: [{ message: { parsed: { summary: 'Shipped the feature.', actionItems: [{ text: 'Deploy', owner: 'Alice' }] } } }]
    });

    await generateMeetingNotes('meeting-1');

    expect(update).toHaveBeenCalledWith({
      where: { meetingId: 'meeting-1' },
      data: expect.objectContaining({
        status: 'READY',
        transcript: 'We shipped the feature.',
        summary: 'Shipped the feature.',
        actionItems: [{ text: 'Deploy', owner: 'Alice' }]
      })
    });
  });

  it('marks notes FAILED when the recording never completes', async () => {
    findUniqueOrThrow.mockResolvedValue({ id: 'meeting-1', livekitRoomName: 'room-1', egressId: 'EG_1' });
    waitForRecordingToFinish.mockResolvedValue(4); // EGRESS_FAILED

    await generateMeetingNotes('meeting-1');

    expect(transcriptionsCreate).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith({
      where: { meetingId: 'meeting-1' },
      data: expect.objectContaining({ status: 'FAILED' })
    });
  });
});
