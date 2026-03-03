/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.askwhy.works',
      },
    ],
  },

  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'framer-motion'],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ]
  },

  webpack(config) {
    // Prevent Three.js examples from being bundled multiple times
    config.resolve.alias = {
      ...config.resolve.alias,
      'three/examples': 'three/examples',
    }
    return config
  },
}

export default nextConfig
