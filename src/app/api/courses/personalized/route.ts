import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const revalidate = 0

/**
 * GET /api/courses/personalized
 * Legacy endpoint kept for backward compatibility.
 * Redirects to /api/courses/relevant.
 */
export async function GET(request: Request) {
  const target = new URL("/api/courses/relevant", request.url)
  return NextResponse.redirect(target, 307)
}
