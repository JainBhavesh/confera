import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Constructed lazily — the AWS SDK doesn't validate credentials eagerly like
// the OpenAI SDK does, but keeping this consistent with the other lazy
// client getters in this codebase avoids surprises either way.
export function getRecordingS3Client(): S3Client {
  return new S3Client({
    endpoint: process.env.RECORDING_S3_ENDPOINT,
    region: process.env.RECORDING_S3_REGION ?? 'us-east-1',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.RECORDING_S3_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.RECORDING_S3_SECRET_ACCESS_KEY ?? ''
    }
  });
}

export const RECORDING_BUCKET = process.env.RECORDING_S3_BUCKET ?? '';

/** A short-lived, credential-free URL the browser can stream/download the recording from directly. */
export async function getRecordingDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
  const command = new GetObjectCommand({ Bucket: RECORDING_BUCKET, Key: key });
  return getSignedUrl(getRecordingS3Client(), command, { expiresIn: expiresInSeconds });
}
