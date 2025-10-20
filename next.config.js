/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Allow builds even if ESLint errors exist
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Allow builds even if TS errors exist
  },
  output: 'export', // ✅ Enables static site export (replaces `npx next export`)
  images: {
    unoptimized: true, // ✅ Prevents Next.js image optimization issues
  },
  reactStrictMode: true, // Optional, but safe to keep
}

module.exports = nextConfig;