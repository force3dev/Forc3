/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ['*'] },
    optimizePackageImports: ['framer-motion', 'recharts', 'lucide-react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [390, 428, 768, 1024, 1280],
    remotePatterns: [
      { protocol: 'https', hostname: 'exercisedb.io' },
      { protocol: 'https', hostname: 'v2.exercisedb.io' },
      { protocol: 'https', hostname: 'images.openfoodfacts.org' },
      { protocol: 'https', hostname: '**.supabase.co' },
    ],
  },
};

export default nextConfig;
