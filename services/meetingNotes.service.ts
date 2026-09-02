import OpenAI, { toFile } from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { z } from 'zod';
import type { MeetingNotes } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { recordingObjectKey, waitForRecordingToFinish, EgressStatus } from '@/services/egress.service';
import { getRecordingS3Client, RECORDING_BUCKET } from '@/lib/recordingStorage';

// Constructed lazily — the OpenAI SDK throws immediately if OPENAI_API_KEY is
// unset, which would otherwise crash this module's import (and the build)
// whenever the key isn't configured yet.
function getOpenAIClient() {
  return new OpenAI();
}

const meetingNotesOutputSchema = z.object({
  summary: z.string(),
  actionItems: z.array(
    z.object({
      text: z.string(),
      owner: z.string().nullable()
    })
  )
});

export function getMeetingNotes(meetingId: string): Promise<MeetingNotes | null> {
  return prisma.meetingNotes.findUnique({ where: { meetingId } });
}

async function fetchRecordingBuffer(bucket: string, key: string): Promise<Buffer> {
  const response = await getRecordingS3Client().send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const chunks: Buffer[] = [];
  for await (const chunk of response.Body as AsyncIterable<Buffer>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

/**
 * Transcribes the meeting's recorded audio and summarizes it into notes and
 * action items via OpenAI. Runs after the meeting has ended, and only when a
 * recording actually exists (see services/egress.service.ts).
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

    const audioBuffer = await fetchRecordingBuffer(RECORDING_BUCKET, recordingObjectKey(meeting));

    const openai = getOpenAIClient();

    const transcription = await openai.audio.transcriptions.create({
      file: await toFile(audioBuffer, 'recording.ogg', { type: 'audio/ogg' }),
      model: 'gpt-4o-transcribe'
    });
    const transcript = transcription.text;

    const completion = await openai.chat.completions.parse({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content:
            'You summarize meeting audio transcripts into concise notes and action items. ' +
            "Only use what is actually said in the transcript — never invent participants, decisions, or " +
            'action items that are not supported by it. If there are no clear action items, return an empty list.'
        },
        {
          role: 'user',
          content: `Meeting transcript:\n\n${transcript}\n\nSummarize the discussion and list any action items.`
        }
      ],
      response_format: zodResponseFormat(meetingNotesOutputSchema, 'meeting_notes')
    });

    const parsed = completion.choices[0]?.message.parsed;
    if (!parsed) {
      throw new Error('Model did not return structured output.');
    }

    await prisma.meetingNotes.update({
      where: { meetingId },
      data: {
        status: 'READY',
        transcript,
        summary: parsed.summary,
        error: null,
        generatedAt: new Date()
      }
    });

    // Re-derive AI action items as first-class rows. On a regenerate, drop
    // the previous AI-sourced set first so it doesn't just accumulate
    // duplicates — manually added items (source: MANUAL) are left alone.
    await prisma.actionItem.deleteMany({ where: { meetingId, source: 'AI' } });
    if (parsed.actionItems.length > 0) {
      // The model's free-text `owner` (e.g. "Alice") has no reliable mapping
      // to a User id, so it's intentionally dropped rather than guessed —
      // a host/admin can assign it manually afterward via the action items UI.
      await prisma.actionItem.createMany({
        data: parsed.actionItems.map((item) => ({
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
