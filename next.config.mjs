/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8080'}/api/:path*`,
      },
      {
        source: '/static/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8080'}/static/:path*`,
      },
    ]
  },
}

export default nextConfig
