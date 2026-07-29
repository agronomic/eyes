/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [85],
    deviceSizes: [360, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [256, 320, 480, 750, 828, 1080],
  },
  async redirects() {
    return [
      {
        source: '/index/:slug',
        destination: '/p/:slug',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/content/media/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
