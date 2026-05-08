/** @type {import('next').NextConfig} */

import createBundleAnalyzer from '@next/bundle-analyzer'

const withBundleAnalyzer = createBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Standalone output for Cloudflare Workers (OpenNext) deployment
  // Supports SSR, API routes, and middleware
  output: 'standalone',
  trailingSlash: true,
}

export default withBundleAnalyzer(nextConfig)
