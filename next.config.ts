import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: true,
  poweredByHeader: false,
};

export default nextConfig;
