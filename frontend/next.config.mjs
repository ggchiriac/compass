import withPWA from "next-pwa";

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true, // F it we ball
  },
  typescript: {
    ignoreBuildErrors: true, // F it we ball
  },
  reactStrictMode: true,
  ...withPWA({
    dest: "public",
    register: true,
    skipWaiting: true,
  }),
};

export default nextConfig;
