import MillionCompiler from '@million/lint';
import million from 'million/compiler';
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
  ...withPWA({
    dest: 'public',
    register: true,
    skipWaiting: true,
  }),
};

const millionConfig = {
  auto: { rsc: true },
};

export default million.next(MillionCompiler.next()(nextConfig), millionConfig);
