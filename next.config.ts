import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    TZ: 'America/New_York',
  },
  // Ensure timezone is properly set for the build environment
  serverExternalPackages: ['dayjs'],
};

export default nextConfig;
