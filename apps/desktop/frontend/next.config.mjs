const isProd = process.env.NODE_ENV === 'production';
const internalHost = process.env.TAURI_DEV_HOST || 'localhost';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure Next.js uses SSG instead of SSR for Tauri compatibility
  output: 'export',
  // Note: This feature is required to use the Next.js Image component in SSG mode.
  images: {
    unoptimized: true,
  },
  // Configure assetPrefix for development
  assetPrefix: isProd ? undefined : `http://${internalHost}:3000`,
  // Configure trailingSlash for static export
  trailingSlash: true,
  // Disable server-side features for Tauri
  experimental: {
    // Disable server components for static export
  }
};

export default nextConfig;