/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/ws',
        destination: '/api/ws',
      },
    ];
  },
};

module.exports = nextConfig;
