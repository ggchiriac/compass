import withPWA from 'next-pwa';

const nextConfig = {
  reactStrictMode: true,
  ...withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
  }),
};

export default nextConfig;
