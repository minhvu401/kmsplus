import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["bcryptjs", "jsonwebtoken"],

  // Optimize Ant Design compilation
  transpilePackages: [
    "antd",
    "@ant-design/icons",
    "@ant-design/nextjs-registry",
    "rc-util",
    "rc-pagination",
    "rc-picker",
  ],

  // Speed up dev build
  experimental: {
    optimizePackageImports: ["antd", "@ant-design/icons"],
  },
}

export default nextConfig
