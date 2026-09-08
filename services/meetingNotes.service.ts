import OpenAI from 'openai';
import type { MeetingNotes } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { recordingObjectKey, waitForRecordingToFinish, EgressStatus } from '@/services/egress.service';
import { getRecordingBuffer } from '@/lib/recordingStorage';
import { processRecording } from '@/services/aiNotes.client';

// Constructed lazily — the OpenAI SDK throws immediately if OPENAI_API_KEY is
// unset, which would otherwise crash this module's import (and the build)
// whenever the key isn't configured yet.
function getOpenAIClient() {
  return new OpenAI();
}

export function getMeetingNotes(meetingId: string): Promise<MeetingNotes | null> {
  return prisma.meetingNotes.findUnique({ where: { meetingId } });
}

/**
 * Transcribes the meeting's recorded audio and summarizes it into notes and
 * action items via the self-hosted ai-notes service (ai-notes/, faster-whisper
 * + a local LLM via Ollama — no audio or transcript ever leaves the server).
 * Runs after the meeting has ended, and only when a recording actually
 * exists (see services/egress.service.ts).
 */
export async function generateMeetingNotes(meetingId: string): Promise<void> {
  const meeting = await prisma.meeting.findUniqueOrThrow({ where: { id: meetingId } });

  if (!meeting.egressId) {
    await prisma.meetingNotes.upsert({
      where: { meetingId },
      create: { meetingId, status: 'SKIPPED', generatedAt: new Date() },
      update: { status: 'SKIPPED', transcript: null, summary: null, error: null, generatedAt: new Date() }
    });
    return;
  }

  await prisma.meetingNotes.upsert({
    where: { meetingId },
    create: { meetingId, status: 'PENDING' },
    update: { status: 'PENDING', error: null }
  });

  try {
    const finalStatus = await waitForRecordingToFinish(meeting, { timeoutMs: 3 * 60_000 });
    if (finalStatus !== EgressStatus.EGRESS_COMPLETE) {
      throw new Error('Recording did not finish successfully.');
    }

    const audioBuffer = await getRecordingBuffer(meeting.recordingKey ?? recordingObjectKey(meeting));

    const { transcript, summary, actionItems } = await processRecording(audioBuffer);

    await prisma.meetingNotes.update({
      where: { meetingId },
      data: {
        status: 'READY',
        transcript,
        summary,
        error: null,
        generatedAt: new Date()
      }
    });

    // Re-derive AI action items as first-class rows. On a regenerate, drop
    // the previous AI-sourced set first so it doesn't just accumulate
    // duplicates — manually added items (source: MANUAL) are left alone.
    await prisma.actionItem.deleteMany({ where: { meetingId, source: 'AI' } });
    if (actionItems.length > 0) {
      // The model's free-text `owner` (e.g. "Alice") has no reliable mapping
      // to a User id, so it's intentionally dropped rather than guessed —
      // a host/admin can assign it manually afterward via the action items UI.
      await prisma.actionItem.createMany({
        data: actionItems.map((item) => ({
          organizationId: meeting.organizationId,
          meetingId,
          title: item.text,
          source: 'AI' as const
        }))
      });
    }
  } catch (err) {
    console.error('[meeting-notes] generation failed:', err);
    await prisma.meetingNotes.update({
      where: { meetingId },
      data: { status: 'FAILED', error: (err as Error).message, generatedAt: new Date() }
    });
  }
}

/**
 * Translates a meeting's transcript into `targetLanguage`, caching the
 * result on MeetingNotes.translations so a repeat request for the same
 * language is a cache hit instead of a new AI call. Reuses the same OpenAI
 * client as note generation — no separate translation provider/env var.
 */
export async function translateTranscript(meetingId: string, targetLanguage: string): Promise<string> {
  const notes = await prisma.meetingNotes.findUniqueOrThrow({ where: { meetingId } });
  if (!notes.transcript) {
    throw new Error('This meeting has no transcript to translate.');
  }

  const cached = (notes.translations as Record<string, string> | null)?.[targetLanguage];
  if (cached) {
    return cached;
  }

  const openai = getOpenAIClient();
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'system',
        content: `Translate the given meeting transcript into ${targetLanguage}. Preserve speaker labels and line breaks. Only output the translated transcript, nothing else.`
      },
      { role: 'user', content: notes.transcript }
    ]
  });

  const translated = completion.choices[0]?.message.content;
  if (!translated) {
    throw new Error('Translation did not return any text.');
  }

  const translations = { ...(notes.translations as Record<string, string> | null), [targetLanguage]: translated };
  await prisma.meetingNotes.update({ where: { meetingId }, data: { translations } });

  return translated;
}
