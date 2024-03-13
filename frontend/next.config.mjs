import millionCompiler from 'million/compiler';
import withPWA from 'next-pwa';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';

// Handling __dirname in ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Base Next.js configuration
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, 'styles')],
  },
  env: {
    PUCOMPASS: process.env.PUCOMPASS,
    BACKEND: process.env.BACKEND,
  },
  // PWA configuration integrated directly
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
};

// Million Compiler configuration
const millionConfig = {
  auto: {
    threshold: 0.05,
    skip: ['useBadHook', /badVariable/g],
    // React Server Components configuration
    rsc: true,
  },
};

// Combine Next.js config with PWA and Million Compiler enhancements
export default millionCompiler.next(withPWA(nextConfig), millionConfig);
