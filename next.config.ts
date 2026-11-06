import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // TODO(hardening PR): re-enable once the remaining legacy type errors are fixed.
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
}

export default nextConfig
