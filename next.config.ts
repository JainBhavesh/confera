import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  serverExternalPackages: ['livekit-server-sdk'],
  outputFileTracingRoot: __dirname
};

export default withNextIntl(nextConfig);
