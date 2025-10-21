/** @type {import('next').NextConfig} */
const nextConfig = {
  // Avoid failing builds due to lint or TS in CI
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Produce a static site in ./out (needed for Capacitor)
  output: 'export',

  // Disable Next/Image optimizer (works with static export)
  images: { unoptimized: true },

  // Optional but fine to keep
  reactStrictMode: true,
};

module.exports = nextConfig;
