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
  output: 'export',
  trailingSlash: true,  // Important for static export
  distDir: 'out',       // Output directory for static export
}

export default withBundleAnalyzer(nextConfig)
