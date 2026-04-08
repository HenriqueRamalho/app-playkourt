import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // Subdomains allowed in local and production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }],
      },
    ];
  },
  allowedDevOrigins: ['localplaykourt.com', '*.localplaykourt.com'],
};

export default nextConfig;
