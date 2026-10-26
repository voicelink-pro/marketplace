import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: { serverActions: { bodySizeLimit: "26mb" } },
  serverExternalPackages: ["@electric-sql/pglite"],
};

export default nextConfig;
