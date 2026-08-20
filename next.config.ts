import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@tastecraft/contracts", "@tastecraft/flavor-engine"],
  poweredByHeader: false
};

export default nextConfig;
