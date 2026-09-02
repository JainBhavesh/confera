import { z } from 'zod';

const emailSchema = z.string().trim().toLowerCase().email().max(255);
const nameSchema = z.string().trim().min(1).max(120);
const passwordSchema = z.string().min(8).max(200);

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(200)
});

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
});

export const otpRequestSchema = z.object({
  email: emailSchema,
  purpose: z.enum(['LOGIN', 'EMAIL_VERIFICATION', 'PASSWORD_RESET'])
});

const otpCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Enter the 6-digit code.');

export const otpVerifySchema = z.object({
  email: emailSchema,
  code: otpCodeSchema
});

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: otpCodeSchema,
  newPassword: passwordSchema
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: passwordSchema
});

export const updateProfileSchema = z.object({
  name: nameSchema
});

export const createUserSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema
});

export const updateUserSchema = z
  .object({
    isActive: z.boolean().optional(),
    name: nameSchema.optional(),
    // Per-user permission overrides. `null` clears the override (falls back
    // to the org default); a boolean sets an explicit override.
    canCreateMeeting: z.boolean().nullable().optional(),
    canCreateLivestream: z.boolean().nullable().optional(),
    canGenerateNotes: z.boolean().nullable().optional(),
    canViewTranscript: z.boolean().nullable().optional(),
    canViewActionItems: z.boolean().nullable().optional(),
    canViewRecording: z.boolean().nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided.' });

export const updateSettingsSchema = z
  .object({
    registrationEnabled: z.boolean().optional(),
    publicMeetingsEnabled: z.boolean().optional(),
    defaultCanCreateMeeting: z.boolean().optional(),
    defaultCanCreateLivestream: z.boolean().optional(),
    defaultCanGenerateNotes: z.boolean().optional(),
    defaultCanViewTranscript: z.boolean().optional(),
    defaultCanViewActionItems: z.boolean().optional(),
    defaultCanViewRecording: z.boolean().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one setting must be provided.' });

export const createMeetingSchema = z.object({
  title: z.string().trim().min(1).max(200)
});

export const guestJoinSchema = z.object({
  guestName: nameSchema
});

export const guestLeaveSchema = z.object({
  sessionId: z.string().trim().min(1)
});

export const moderateParticipantSchema = z.object({
  identity: z.string().trim().min(1),
  source: z.enum(['camera', 'microphone']),
  muted: z.boolean()
});

export const meetingMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000)
});

export const createLivestreamSchema = z.object({
  title: z.string().trim().min(1).max(200),
  visibility: z.enum(['PUBLIC', 'PRIVATE']).optional()
});

export const livestreamMessageSchema = z.object({
  message: z.string().trim().min(1).max(2000),
  // Only present (and required) for a guest sender — resolves their display
  // name server-side from the LivestreamViewerSession created at join time.
  sessionId: z.string().trim().min(1).optional()
});

export const startLivestreamRecordingSchema = z.object({
  audioTrackId: z.string().trim().min(1),
  videoTrackId: z.string().trim().min(1)
});

export const translateTranscriptSchema = z.object({
  targetLanguage: z.string().trim().min(2).max(50)
});

export const createActionItemSchema = z.object({
  meetingId: z.string().trim().min(1),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
  dueDate: z.coerce.date().optional(),
  assignedToUserId: z.string().trim().min(1).optional()
});

export const updateActionItemSchema = z
  .object({
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    dueDate: z.coerce.date().nullable().optional(),
    assignedToUserId: z.string().trim().min(1).nullable().optional()
  })
  .refine((data) => Object.keys(data).length > 0, { message: 'At least one field must be provided.' });
