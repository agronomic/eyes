/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // WebP only — AVIF doubles Vercel Image Optimization transformations.
    formats: ['image/webp'],
    // Must match mediaQuality in app/helpers.js
    qualities: [85],
    // Keep variants few for Vercel free-tier transform limits.
    // deviceSizes: stage / case full-width (100vw) and case-pair (50–100vw)
    deviceSizes: [640, 1080, 1920],
    // imageSizes: experiment (~80px) and thumb/cover (~15–25vw)
    imageSizes: [96, 256],
    // Re-transform at most monthly; rename the file if you need an immediate refresh.
    minimumCacheTTL: 2678400,
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
        // Separate from Image Optimization TTL above.
        source: '/content/media/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
