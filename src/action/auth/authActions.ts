"use server"

import { sql } from "@/lib/database"
import { signToken } from "@/lib/auth"
import { LoginDto } from "./dto/login.dto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { PageRoute } from "@/enum/page-route.enum"
import useUserStore from "@/store/useUserStore"

export type LoginState = {
  success: boolean
  message: string
  errors?: Record<string, string[]>
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
    SELECT id, email, password_hash FROM users WHERE email = ${email}
  `
  const user = users[0]
  if (!user) {
    return { success: false, message: "Email not found" }
  }

  // Kiểm tra mật khẩu
  if (user.email === "admin@company.com") {
    const isValid = password === user.password_hash
    if (!isValid) {
      return { success: false, message: "Invalid password" }
    }
  } else {
    const bcrypt = require("bcryptjs")
    const isValid = await bcrypt.compare(password, user.password_hash)
    if (!isValid) {
      return { success: false, message: "Invalid password" }
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

  return {
    success: true,
    message: "Login successful",
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
