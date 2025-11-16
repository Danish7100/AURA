/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow access from network devices for mobile testing
  experimental: {
    allowedDevOrigins: ['*']
  }
};

export default nextConfig;
