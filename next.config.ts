import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["bcryptjs", "jsonwebtoken"],
};

export default nextConfig;
