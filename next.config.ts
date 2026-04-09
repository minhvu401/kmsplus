import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["bcryptjs", "jsonwebtoken"],

  // OPTIMIZED: Image optimization
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // Optimize Ant Design compilation
  transpilePackages: [
    "antd",
    "@ant-design/icons",
    "@ant-design/nextjs-registry",
    "rc-util",
    "rc-pagination",
    "rc-picker",
  ],

  // Compress static assets
  compress: true,

  // Speed up dev build & Experimental optimizations
  experimental: {
    optimizePackageImports: [
      "antd",
      "@ant-design/icons",
      "lucide-react",
      "recharts",
    ],

    serverActions: {
      bodySizeLimit: "5mb",
    },
  },
}

export default nextConfig
