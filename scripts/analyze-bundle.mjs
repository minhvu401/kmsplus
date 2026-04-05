#!/usr/bin/env node

/**
 * Build size analyzer - giúp monitor bundle size qua các builds
 * Chạy: pnpm analyze-build
 */

import fs from "fs"
import path from "path"
import { execSync } from "child_process"

const BUNDLE_REPORT_DIR = ".next/analyze"
const BUNDLE_LIMIT_MB = 2 // Warn if bundle > 2MB

function getFileSizeInMB(filePath) {
  const stats = fs.statSync(filePath)
  return (stats.size / (1024 * 1024)).toFixed(2)
}

function analyzeBundle() {
  console.log("📊 Analyzing Next.js Bundle Size...\n")

  try {
    const nextDir = path.join(process.cwd(), ".next")

    if (!fs.existsSync(nextDir)) {
      console.log("❌ .next directory not found. Run 'pnpm build' first.\n")
      process.exit(1)
    }

    // Check static directory
    const staticDir = path.join(nextDir, "static")
    if (fs.existsSync(staticDir)) {
      console.log("📁 Static Files:")

      // Check chunks
      const chunksDir = path.join(staticDir, "chunks")
      if (fs.existsSync(chunksDir)) {
        const files = fs.readdirSync(chunksDir)
        let totalSize = 0

        files.forEach((file) => {
          if (file.endsWith(".js")) {
            const filePath = path.join(chunksDir, file)
            const sizeMB = parseFloat(getFileSizeInMB(filePath))
            totalSize += sizeMB

            const warning = sizeMB > 0.5 ? " ⚠️ " : ""
            console.log(`   ${file}: ${sizeMB}MB${warning}`)
          }
        })

        console.log(`\n   📦 Total chunks: ${totalSize.toFixed(2)}MB\n`)

        if (totalSize > BUNDLE_LIMIT_MB) {
          console.log(
            `   ⚠️  WARNING: Total bundle size (${totalSize.toFixed(2)}MB) exceeds limit (${BUNDLE_LIMIT_MB}MB)\n`
          )
        }
      }
    }

    // Server side analysis
    const serverDir = path.join(nextDir, "server")
    if (fs.existsSync(serverDir)) {
      console.log("🖥️  Server Files:")

      const files = fs.readdirSync(serverDir)
      let totalSize = 0

      files.forEach((file) => {
        if (file.endsWith(".js")) {
          const filePath = path.join(serverDir, file)
          const sizeMB = parseFloat(getFileSizeInMB(filePath))
          totalSize += sizeMB
          console.log(`   ${file}: ${sizeMB}MB`)
        }
      })

      console.log(`\n   📦 Total server: ${totalSize.toFixed(2)}MB\n`)
    }

    console.log("✅ Bundle analysis complete!\n")
    console.log("💡 Tips to reduce bundle size:")
    console.log("   • Use dynamic imports for heavy components")
    console.log("   • Enable tree-shaking for unused code")
    console.log("   • Split large components into smaller chunks")
    console.log("   • Lazy load route components\n")
  } catch (error) {
    console.error("❌ Error analyzing bundle:", error.message)
    process.exit(1)
  }
}

analyzeBundle()
