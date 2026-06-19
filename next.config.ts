import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Скрыть dev-индикатор Next.js (чёрный кружок с «N» в углу)
  devIndicators: false,
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
