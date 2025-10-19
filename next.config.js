/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // ✅ Allow builds even if ESLint finds problems
  },
  typescript: {
    ignoreBuildErrors: true, // ✅ Allow builds even if TypeScript finds errors
  },
}

module.exports = nextConfig