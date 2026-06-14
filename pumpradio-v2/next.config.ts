import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  experimental: {
    optimizePackageImports: ['@react-three/fiber', 'three'],
  },

  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    },
    {
      source: '/manifest.json',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
      ],
    },
  ],
}

export default nextConfig
