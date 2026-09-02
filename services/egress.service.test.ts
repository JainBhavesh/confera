import { describe, expect, it, vi, beforeEach } from 'vitest';

const { update } = vi.hoisted(() => ({ update: vi.fn() }));

const { listEgress, startTrackCompositeEgress, stopEgress } = vi.hoisted(() => ({
  listEgress: vi.fn(),
  startTrackCompositeEgress: vi.fn(),
  stopEgress: vi.fn()
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: { livestream: { update }, meeting: {} }
}));

vi.mock('livekit-server-sdk', async () => {
  const actual = await vi.importActual<typeof import('livekit-server-sdk')>('livekit-server-sdk');
  return {
    ...actual,
    EgressClient: class {
      listEgress = listEgress;
      startTrackCompositeEgress = startTrackCompositeEgress;
      stopEgress = stopEgress;
    }
  };
});

const { checkLivestreamRecordingStatus, startLivestreamRecording, stopLivestreamRecording, EgressStatus } = await import(
  './egress.service'
);

function livestream(overrides: Partial<{ egressId: string | null; recordingStatus: string }> = {}) {
  return {
    id: 'live-1',
    livekitRoomName: 'room-1',
    egressId: 'EG_1',
    recordingStatus: 'PROCESSING',
    ...overrides
  } as any;
}

describe('checkLivestreamRecordingStatus', () => {
  beforeEach(() => {
    update.mockReset();
    listEgress.mockReset();
  });

  it('does nothing when there is no recording in flight', async () => {
    const result = await checkLivestreamRecordingStatus(livestream({ recordingStatus: 'NONE' }));

    expect(listEgress).not.toHaveBeenCalled();
    expect(result.recordingStatus).toBe('NONE');
  });

  it('checks status even while still RECORDING — the egress can auto-complete (source track closed) before the explicit stop call reaches it', async () => {
    listEgress.mockResolvedValue([{ status: EgressStatus.EGRESS_COMPLETE, fileResults: [{ filename: 'room-1.mp4' }] }]);
    update.mockResolvedValue({ ...livestream(), recordingStatus: 'READY', recordingKey: 'room-1.mp4' });

    await checkLivestreamRecordingStatus(livestream({ recordingStatus: 'RECORDING' }));

    expect(listEgress).toHaveBeenCalledWith({ egressId: 'EG_1' });
    expect(update).toHaveBeenCalledWith({
      where: { id: 'live-1' },
      data: { recordingStatus: 'READY', recordingKey: 'room-1.mp4' }
    });
  });

  it('marks READY once egress completes, saving the uploaded filename', async () => {
    listEgress.mockResolvedValue([{ status: EgressStatus.EGRESS_COMPLETE, fileResults: [{ filename: 'room-1.mp4' }] }]);
    update.mockResolvedValue({ ...livestream(), recordingStatus: 'READY', recordingKey: 'room-1.mp4' });

    await checkLivestreamRecordingStatus(livestream());

    expect(update).toHaveBeenCalledWith({
      where: { id: 'live-1' },
      data: { recordingStatus: 'READY', recordingKey: 'room-1.mp4' }
    });
  });

  it('marks FAILED when egress aborts', async () => {
    listEgress.mockResolvedValue([{ status: EgressStatus.EGRESS_ABORTED }]);
    update.mockResolvedValue({ ...livestream(), recordingStatus: 'FAILED' });

    await checkLivestreamRecordingStatus(livestream());

    expect(update).toHaveBeenCalledWith({ where: { id: 'live-1' }, data: { recordingStatus: 'FAILED' } });
  });

  it('leaves status alone while still recording/ending', async () => {
    listEgress.mockResolvedValue([{ status: EgressStatus.EGRESS_ACTIVE }]);

    await checkLivestreamRecordingStatus(livestream());

    expect(update).not.toHaveBeenCalled();
  });
});

describe('startLivestreamRecording / stopLivestreamRecording', () => {
  beforeEach(() => {
    update.mockReset();
    startTrackCompositeEgress.mockReset();
    stopEgress.mockReset();
  });

  it('saves the egressId and marks RECORDING on success', async () => {
    startTrackCompositeEgress.mockResolvedValue({ egressId: 'EG_2' });

    await startLivestreamRecording(livestream({ egressId: null }), { audioTrackId: 'TR_A', videoTrackId: 'TR_V' });

    expect(update).toHaveBeenCalledWith({
      where: { id: 'live-1' },
      data: { egressId: 'EG_2', recordingStatus: 'RECORDING' }
    });
  });

  it('marks FAILED if egress rejects the request (e.g. insufficient CPU budget)', async () => {
    startTrackCompositeEgress.mockRejectedValue(new Error('no response from servers'));

    await startLivestreamRecording(livestream({ egressId: null }), { audioTrackId: 'TR_A', videoTrackId: 'TR_V' });

    expect(update).toHaveBeenCalledWith({ where: { id: 'live-1' }, data: { recordingStatus: 'FAILED' } });
  });

  it('stops egress and marks PROCESSING', async () => {
    stopEgress.mockResolvedValue({});

    await stopLivestreamRecording(livestream());

    expect(stopEgress).toHaveBeenCalledWith('EG_1');
    expect(update).toHaveBeenCalledWith({ where: { id: 'live-1' }, data: { recordingStatus: 'PROCESSING' } });
  });

  it('is a no-op when no recording was started', async () => {
    await stopLivestreamRecording(livestream({ egressId: null }));

    expect(stopEgress).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });

  it('still marks PROCESSING when stopEgress rejects because the egress already auto-completed', async () => {
    stopEgress.mockRejectedValue(new Error('twirp error: egress with status EGRESS_COMPLETE cannot be stopped'));

    await stopLivestreamRecording(livestream());

    expect(update).toHaveBeenCalledWith({ where: { id: 'live-1' }, data: { recordingStatus: 'PROCESSING' } });
  });
});
