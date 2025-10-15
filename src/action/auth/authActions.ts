"use server";

import { sql } from "@/lib/neonClient";
import { signToken } from "@/lib/jwt";
import { LoginDto } from "@/dto/auth/login.dto";
import { cookies } from "next/headers";

export type LoginState = {
  success: boolean;
  message: string;
  errors?: Record<string, string[]>;
};

export async function loginAction(
  prevState: LoginState, // cái này là của useActionState truyền vào check lại sau
  formData: FormData
): Promise<LoginState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = LoginDto.safeParse(raw);

  if (!parsed.success) {
    return {
      success: false,
      message: "Invalid input",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  // 🔹 Kiểm tra user tồn tại
  const users = await sql`
    SELECT id, email, password_hash FROM users WHERE email = ${email}
  `;
  const user = users[0];
  console.log(user);
  if (!user) {
    return { success: false, message: "Email not found" };
  }

  // 🔹 Kiểm tra mật khẩu
  // const isValid = await bcrypt.compare(password, user.password_hash);
  // if (!isValid) {
  //   return { success: false, message: "Invalid password" };
  // }

  // -------------bùa chút
  const isValid = password === user.password_hash;
  if (!isValid) {
    return { success: false, message: "Invalid password" };
  }

  // 🔹 Tạo token
  const token = signToken({
    id: user.id,
    email: user.email,
  });

  // 🔹 Set cookie và redirect
  const cookieStore = await cookies();
  cookieStore.set("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 1 day
  });

  return {
    success: true,
    message: "Login successful",
  };
}
