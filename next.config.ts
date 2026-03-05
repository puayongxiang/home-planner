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
  serverExternalPackages: ["puppeteer"],
};

export default nextConfig;
