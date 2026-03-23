import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "d1hy6t2xeg0mdl.cloudfront.net",
      },
      {
        protocol: "https",
        hostname: "*.qanvast.com",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_ENABLE_INTERNAL_TOOLS:
      process.env.NEXT_PUBLIC_ENABLE_INTERNAL_TOOLS || "",
  },
  serverExternalPackages: ["puppeteer"],
};

export default nextConfig;
