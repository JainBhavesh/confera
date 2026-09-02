import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomBytes } from 'crypto';

// Deliberately separate from lib/recordingStorage.ts's client: recordings are
// private (served via short-lived signed URLs), while avatars are rendered
// directly in <img> tags across the app and so need a public-read bucket —
// mixing the two policies on one bucket would be an easy way to accidentally
// leak a recording. Same S3-compatible setup either way; just point
// AVATAR_S3_* at a public bucket (see .env.example).
function getAvatarS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.AVATAR_S3_ENDPOINT,
    region: process.env.AVATAR_S3_REGION ?? 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.AVATAR_S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.AVATAR_S3_SECRET_ACCESS_KEY ?? ''
    }
  });
}

const AVATAR_BUCKET = process.env.AVATAR_S3_BUCKET ?? '';
const AVATAR_PUBLIC_URL_BASE = (process.env.AVATAR_S3_PUBLIC_URL_BASE ?? '').replace(/\/$/, '');

export function avatarStorageConfigured(): boolean {
  return Boolean(process.env.AVATAR_S3_ENDPOINT && AVATAR_BUCKET && AVATAR_PUBLIC_URL_BASE);
}

function extensionForContentType(contentType: string): string {
  switch (contentType) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    default:
      return 'jpg';
  }
}

/** Uploads raw image bytes (a registration form upload) and returns its public URL. */
export async function uploadAvatarBuffer(input: { body: Buffer; contentType: string }): Promise<string> {
  if (!avatarStorageConfigured()) {
    throw new Error('Avatar storage is not configured (AVATAR_S3_* env vars).');
  }

  const key = `avatars/${randomBytes(16).toString('hex')}.${extensionForContentType(input.contentType)}`;

  await getAvatarS3Client().send(
    new PutObjectCommand({
      Bucket: AVATAR_BUCKET,
      Key: key,
      Body: input.body,
      ContentType: input.contentType,
      CacheControl: 'public, max-age=31536000, immutable'
    })
  );

  return `${AVATAR_PUBLIC_URL_BASE}/${key}`;
}

/**
 * Downloads a provider-hosted avatar (Google/Facebook) and re-uploads it to
 * our own bucket, so the URL we store never depends on the provider's CDN
 * staying reachable or the signed URL not expiring. Best-effort — returns
 * null on any failure rather than blocking sign-in over a missing photo.
 */
export async function uploadAvatarFromUrl(sourceUrl: string): Promise<string | null> {
  if (!avatarStorageConfigured()) return null;

  try {
    const response = await fetch(sourceUrl);
    if (!response.ok) return null;

    const contentType = response.headers.get('content-type') ?? 'image/jpeg';
    if (!contentType.startsWith('image/')) return null;

    const body = Buffer.from(await response.arrayBuffer());
    return await uploadAvatarBuffer({ body, contentType });
  } catch (err) {
    console.warn('[avatarStorage] could not mirror provider avatar:', (err as Error).message);
    return null;
  }
}
