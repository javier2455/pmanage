import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Output standalone for better custom server support
  output: "standalone",
  // Ensure trailing slashes for cPanel compatibility
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "bucket.dveloxsoft.com",
      },
    ],
  },
};

export default nextConfig;
