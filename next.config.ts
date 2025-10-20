import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export', // ✅ replaces 'next export' command
  images: {
    unoptimized: true, // ✅ prevents image optimization errors
  },
  reactStrictMode: true, // optional, safe to keep
};

export default nextConfig;