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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get("token")?.value

  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Nếu đã login và đang ở trang login → redirect về dashboard
  if (token && pathname === PageRoute.LOGIN) {
    try {
      verifyToken(token) // Verify token còn valid không
      return NextResponse.redirect(new URL(PageRoute.DASHBOARD, request.url))
    } catch (error) {
      // Token invalid → xóa cookie
      const response = NextResponse.next()
      response.cookies.delete("token")
      return response
    }
  }

  // Nếu chưa login và truy cập protected route → redirect về login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL(PageRoute.LOGIN, request.url)
    // Lưu URL để redirect back sau khi login
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Nếu có token nhưng truy cập protected route → verify token
  if (isProtectedRoute && token) {
    try {
      verifyToken(token)
      return NextResponse.next() // Token valid → cho qua
    } catch (error) {
      // Token invalid/expired → redirect về login và xóa cookie
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
