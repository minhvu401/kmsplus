"use client"

import React, { Suspense } from "react"
import LoginPageContent from "./LoginPageContent"

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          }}
        >
          <div>Loading...</div>
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  )
}
