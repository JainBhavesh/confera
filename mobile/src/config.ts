// Expo inlines any EXPO_PUBLIC_* env var at build time — set it in mobile/.env
// (see mobile/.env.example) to point at the Next.js API for your environment.
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';
