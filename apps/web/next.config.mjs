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
  // Only use static export for production builds, not dev mode
  output: process.env.NODE_ENV === 'production' ? 'export' : undefined,
  trailingSlash: true,  // Important for static export
  distDir: process.env.NODE_ENV === 'production' ? 'out' : '.next',       // Output directory for static export
}

export default withBundleAnalyzer(nextConfig)
