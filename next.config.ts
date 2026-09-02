import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['livekit-server-sdk'],
  outputFileTracingRoot: __dirname
};

export default nextConfig;
