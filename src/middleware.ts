import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { verifyToken } from "@/lib/auth"
import { PageRoute } from "@/enum/page-route.enum"
import { Role } from "@/enum/role.enum"
import { hasPermission } from "@/config/RolePermission.config"
import { Permission } from "@/enum/permission.enum"

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
  PageRoute.USER_MANAGEMENT,
]

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  const token = request.cookies.get("token")?.value
  
  // Check for NextAuth session - NextAuth v5 can use different cookie names
  const nextAuthToken = 
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("authjs.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value ||
    request.cookies.get("__Secure-authjs.session-token")?.value

  // Check if user is authenticated via custom token OR NextAuth
  const isAuthenticated = token || nextAuthToken

  // console.log("Middleware called for:", pathname + search)
  // console.log("Token:", token ? "exists" : "undefined")
  // console.log("NextAuth Token:", nextAuthToken ? "exists" : "undefined")
  // console.log("All cookies:", Array.from(request.cookies.getSetCookie() || []))

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  )

  // Nếu đã login và đang ở trang login (không có callbackUrl) → redirect về dashboard
  if (
    isAuthenticated &&
    pathname === PageRoute.LOGIN &&
    !search.includes("callbackUrl")
  ) {
    try {
      // If custom token exists, verify it
      if (token) {
        await verifyToken(token)
      }
      // If NextAuth token exists, just allow (NextAuth will validate it)
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
  if (isProtectedRoute && !isAuthenticated) {
    console.log("No token, redirecting to login")
    const loginUrl = new URL(PageRoute.LOGIN, request.url)
    loginUrl.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Nếu có custom token nhưng truy cập protected route → verify token
  if (isProtectedRoute && token) {
    try {
      const decoded = await verifyToken(token)

      // Kiểm tra quyền truy cập user-management
      if (pathname.startsWith(PageRoute.USER_MANAGEMENT)) {
        const userRole = decoded.role as Role
        if (!hasPermission(userRole, Permission.MANAGE_USERS)) {
          console.log("User does not have MANAGE_USERS permission")
          return NextResponse.redirect(
            new URL(PageRoute.DASHBOARD, request.url)
          )
        }
      }

      // console.log("Token verified successfully for:", pathname)
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

  // Nếu có NextAuth token → cho qua (NextAuth will handle validation)
  if (isProtectedRoute && nextAuthToken) {
    console.log("NextAuth token verified, allowing access")
    return NextResponse.next()
  }

  // Các route khác → cho qua
  return NextResponse.next()
}

export const config = {
  matcher: [
    //trừ các route sau
    "/((?!api|_next/static|_next/image|.*\\..*|_next).*)",
  ],
}
