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

    serverActions: {
      // 👇 THÊM ĐOẠN NÀY VÀO ĐÂY ĐỂ FIX LỖI 1MB LIMIT
      bodySizeLimit: "5mb",
    },
  },
}

export default nextConfig
