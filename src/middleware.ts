import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"
import { PageRoute } from "@/enum/page-route.enum"

// Danh sách routes public (không cần login)
const publicRoutes = [PageRoute.LOGIN]

// Danh sách routes cần authentication
const protectedRoutes = [
  PageRoute.DASHBOARD,
  PageRoute.PROFILE,
  PageRoute.COURSES,
  PageRoute.ARTICLES,
  PageRoute.QUESTIONS,
  PageRoute.QUIZZES,
  PageRoute.QUESTION_BANK,
]

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get("token")?.value

  console.log("Middleware called for:", pathname + search)
  console.log("Token:", token ? "exists" : "undefined")

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Nếu đã login và đang ở trang login (không có callbackUrl) → redirect về dashboard
  if (
    token &&
    pathname === PageRoute.LOGIN &&
    !search.includes("callbackUrl")
  ) {
    try {
      await verifyToken(token) // Verify token còn valid không
      console.log("Redirecting to dashboard (already logged in)")
      return NextResponse.redirect(new URL(PageRoute.DASHBOARD, request.url))
    } catch (error) {
      // Token invalid → xóa cookie
      console.log("Token invalid, deleting cookie")
      const response = NextResponse.next()
      response.cookies.delete("token")
      return response
    }
  }

  // Nếu chưa login và truy cập protected route → redirect về login
  if (isProtectedRoute && !token) {
    console.log("No token, redirecting to login")
    const loginUrl = new URL(PageRoute.LOGIN, request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Nếu có token nhưng truy cập protected route → verify token
  if (isProtectedRoute && token) {
    try {
      const decoded = await verifyToken(token)
      console.log("Token verified successfully for:", pathname)
      return NextResponse.next() // Token valid → cho qua
    } catch (error: any) {
      // Token invalid/expired → redirect về login và xóa cookie
      console.log("Token verification failed:", error?.message || error)
      const loginUrl = new URL(PageRoute.LOGIN, request.url)
      loginUrl.searchParams.set("reason", "session_expired")
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete("token")
      return response
    }
  }

  // Các route khác → cho qua
  return NextResponse.next()
}

export const config = {
  matcher: [
    //trừ các route sau
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
}
