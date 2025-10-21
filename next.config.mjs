/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep your other Next config here if you have any
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Never bundle server-only libs into the browser bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
        'node:fs': false,
        fs: false,
        'node:path': false,
        path: false,
      };
    }
    return config;
  },
  experimental: {
    // Ensures server-only deps (like cheerio) stay server-side
    serverComponentsExternalPackages: ['cheerio'],
  },
};

export default nextConfig;
