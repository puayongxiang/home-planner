import type { NextConfig } from "next";

const isStaticExport = !!process.env.STATIC_EXPORT;

const nextConfig: NextConfig = {
  output: isStaticExport ? "export" : undefined,
  images: {
    unoptimized: isStaticExport,
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
    NEXT_PUBLIC_STATIC: isStaticExport ? "1" : "",
  },
  serverExternalPackages: ["puppeteer"],
};

export default nextConfig;
