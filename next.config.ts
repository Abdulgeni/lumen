import type { NextConfig } from "next";
import "./src/env";

const nextConfig: NextConfig = {
  trailingSlash: false,
  reactStrictMode: true,
  poweredByHeader: false,
  serverExternalPackages: ["mammoth", "linkedom", "undici"],
};

export default nextConfig;
