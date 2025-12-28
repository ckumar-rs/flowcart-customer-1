/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'localhost',
      'flowcart-api.azurewebsites.net',
      'picsum.photos',
      '10.5.0.4',
      'img.youtube.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.azurewebsites.net',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '10.5.0.4',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
    ],
    unoptimized: false,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Custom loader to handle external images that might fail optimization
    loader: 'default',
    // Allow all image formats
    formats: ['image/avif', 'image/webp'],
    // Increase timeout for external image fetching
    minimumCacheTTL: 60,
  },
  output: 'standalone',
  env: {
    //http://20.42.90.94/flowcartapi/api
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://20.42.90.94/flowcartapi/api',
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL || 'ws://20.42.90.94/flowcartapi/hubs',
  },
  // PWA Configuration
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

