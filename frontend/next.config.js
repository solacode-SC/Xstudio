/** @type {import('next').NextConfig} */
const backendOrigin = process.env.BACKEND_ORIGIN

const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    if (!backendOrigin) return []
    return [
      { source: '/api/:path*', destination: `${backendOrigin}/api/:path*` },
      { source: '/files/:path*', destination: `${backendOrigin}/files/:path*` }
    ]
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
}

module.exports = nextConfig
