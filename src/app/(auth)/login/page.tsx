"use client"

import React, { useState } from "react"
import { useSearchParams } from "next/navigation"
import LoginForm from "@/app/(auth)/login/components/LoginForm"
import ForgotPasswordForm from "@/app/(auth)/login/components/ForgotPasswordForm"

export default function LoginPage() {
  const searchParams = useSearchParams()
  const [showForgot, setShowForgot] = useState(false)

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      }}
    >
      {!showForgot ? (
        <LoginForm
          callbackUrl={searchParams?.get("callbackUrl")}
          onForgotPassword={() => setShowForgot(true)}
          onSuccess={() => {
            const cb = searchParams?.get("callbackUrl") || "/dashboard"
            window.location.replace(cb)
          }}
        />
      ) : (
        <ForgotPasswordForm onBackToLogin={() => setShowForgot(false)} />
      )}
    </div>
  )
}
