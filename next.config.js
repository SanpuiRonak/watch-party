/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingIncludes: {
    '/': ['./socket-server.ts']
  }
}

module.exports = nextConfig