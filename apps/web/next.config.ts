import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@flavorpilot/contracts", "@flavorpilot/flavor-engine"],
  poweredByHeader: false
};

export default nextConfig;
