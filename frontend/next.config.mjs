import withPWA from 'next-pwa';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  env: {
    PUCOMPASS: process.env.PUCOMPASS,
    BACKEND: process.env.BACKEND,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.BACKEND}/:path*`,
      },
    ];
  },
  ...withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
  }),
};

export default nextConfig;
