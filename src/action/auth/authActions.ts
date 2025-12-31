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
    department: string
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
    SELECT id, email, full_name, department, avatar_url, created_at, password_hash FROM users WHERE email = ${email}
  `
  const user = users[0]
  if (!user) {
    return { success: false, message: "Email not found" }
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

  // Tạo token
  const token = await signToken({
    id: user.id,
    email: user.email,
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
      department: user.department,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
    },
  }
}

export async function logoutAction() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("token")

    const { clearUser } = useUserStore.getState() // Lấy phương thức clearUser từ store
    clearUser()

    // redirect(PageRoute.LOGIN)
  } catch (error) {}
}
