"use server"

import { sql } from "@/lib/database"
import { signToken } from "@/lib/auth"
import { LoginDto } from "./dto/login.dto"
import { cookies } from "next/headers"
import useUserStore from "@/store/useUserStore"

export type LoginState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
  user?: {
    id: string
    email: string
    full_name: string
    avatar_url: string
    created_at: Date
  }
}

export async function loginAction(
  prevState: LoginState, // cái này là của useActionState truyền vào check lại sau   // ← State trước đó từ useActionState
  formData: FormData
): Promise<LoginState> {
  const raw = Object.fromEntries(formData.entries())
  const parsed = LoginDto.safeParse(raw)

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    }
  }

  const { email, password } = parsed.data

  // Kiểm tra user tồn tại
  const users = await sql`
    SELECT 
      u.id, 
      u.email, 
      u.full_name, 
      u.avatar_url, 
      u.created_at, 
      u.password_hash,
      u.status,
      r.name as role_name
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    WHERE u.email = ${email}
    LIMIT 1
  `
  const user = users[0]
  if (!user) {
    return { success: false, message: "Email not found" }
  }

  // Kiểm tra trạng thái tài khoản
  if (user.status !== "active") {
    return { success: false, message: "Tài khoản đã bị vô hiệu" }
  }

  // Kiểm tra mật khẩu
  if (user.email === "admin@company.com") {
    const isValid = password === user.password_hash
    if (!isValid) {
      return { success: false, message: "Mật khẩu không chính xác" }
    }
  } else {
    const bcrypt = require("bcryptjs")
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return { success: false, message: "Mật khẩu không chính xác" }
    }
  }

  // Tạo token (bao gồm role)
  const token = await signToken({
    id: user.id,
    email: user.email,
    role: user.role_name, // Thêm role vào token
  })

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 1 day
  })

  // console.log("User logged in:", token)

  return {
    success: true,
    message: "Login successful",
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    },
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies()
    
    // Delete custom JWT token
    cookieStore.delete("token")
    
    // Delete NextAuth session cookies (multiple possible names for v5)
    cookieStore.delete("next-auth.session-token")
    cookieStore.delete("authjs.session-token")
    cookieStore.delete("__Secure-next-auth.session-token")
    cookieStore.delete("__Secure-authjs.session-token")

    const { clearUser } = useUserStore.getState() // Lấy phương thức clearUser từ store
    clearUser()

    // redirect(PageRoute.LOGIN)
  } catch (error) {
    console.error("Error in logoutAction:", error)
  }
}

export type ForgotPasswordState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
}

export async function forgotPasswordAction(
  formData: FormData
): Promise<ForgotPasswordState> {
  try {
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    // Validate inputs
    if (!email || !password || !confirmPassword) {
      return {
        success: false,
        message: "Vui lòng điền tất cả các trường",
      }
    }

    if (password !== confirmPassword) {
      return {
        success: false,
        message: "Mật khẩu không khớp",
      }
    }

    if (password.length < 6) {
      return {
        success: false,
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      }
    }

    // Check if user exists
    const users = await sql`
      SELECT id, email FROM users WHERE email = ${email.toLowerCase()} AND is_deleted = false
    `

    if (!users || users.length === 0) {
      return {
        success: false,
        message: "Email không tồn tại trong hệ thống",
      }
    }

    const userId = users[0].id

    // Hash new password
    const bcrypt = require("bcryptjs")
    const hashedPassword = await bcrypt.hash(password, 10)

    // Update password
    await sql`
      UPDATE users 
      SET password_hash = ${hashedPassword}
      WHERE id = ${userId}
    `

    return {
      success: true,
      message: "Mật khẩu đã được đặt lại thành công. Vui lòng đăng nhập lại.",
    }
  } catch (error) {
    console.error("Error in forgotPasswordAction:", error)
    return {
      success: false,
      message: "Có lỗi xảy ra. Vui lòng thử lại.",
    }
  }
}
