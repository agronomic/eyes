/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Serve /content/media directly — no Vercel Image Optimization (quota 402s).
    // Masters + *-sm.webp are prepared by npm run sync-media.
    unoptimized: true,
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
        // Raw files: revalidate so same-name swaps aren't stuck behind immutable cache.
        source: '/content/media/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
