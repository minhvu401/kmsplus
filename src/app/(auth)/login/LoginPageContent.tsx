"use client"

import React, { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import dynamic from "next/dynamic"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

// Dynamic import to avoid hydration mismatch caused by browser extensions
const LoginForm = dynamic(
  () => import("@/app/(auth)/login/components/LoginForm"),
  { ssr: false }
)
const ForgotPasswordForm = dynamic(
  () => import("@/app/(auth)/login/components/ForgotPasswordForm"),
  { ssr: false }
)

export default function LoginPageContent() {
  const searchParams = useSearchParams()
  const [showForgot, setShowForgot] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const language = useLanguageStore((state) => state.language)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="h-screen w-screen flex overflow-hidden" suppressHydrationWarning>
        {/* Left side - Loading skeleton */}
        <div className="hidden lg:flex lg:w-1/2 bg-gray-200 animate-pulse" suppressHydrationWarning />
        {/* Right side - Form skeleton */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50" suppressHydrationWarning>
          <div className="w-full max-w-md animate-pulse" suppressHydrationWarning>
            <div className="h-8 bg-gray-200 rounded w-3/4 mx-auto mb-4" suppressHydrationWarning></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-8" suppressHydrationWarning></div>
            <div className="h-10 bg-gray-200 rounded mb-4" suppressHydrationWarning></div>
            <div className="h-10 bg-gray-200 rounded mb-4" suppressHydrationWarning></div>
            <div className="h-10 bg-gray-200 rounded" suppressHydrationWarning></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex overflow-hidden" suppressHydrationWarning>
      {/* Left side - Background Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        suppressHydrationWarning
      >
        <img
          src="/background.png"
          alt="Login Background"
          className="absolute inset-0 w-full h-full object-cover animate-scale-in"
        />
        {/* Overlay gradient */}
        <div 
          className="absolute inset-0 animate-fade-in"
          style={{ 
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.85) 0%, rgba(29, 78, 216, 0.92) 100%)" 
          }}
        />
        {/* Content on image */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <img
            src="/logo.png"
            alt="KMSPlus Logo"
            className="w-24 h-24 object-contain mb-3 animate-bounce-in drop-shadow-2xl"
          />
          <h1 className="text-4xl font-bold mb-2 text-center animate-slide-up" style={{ animationDelay: "0.2s" }}>
            KMSPlus
          </h1>
          <p className="text-lg text-white/90 text-center max-w-md animate-slide-up" style={{ animationDelay: "0.3s" }}>
            {t("login.system_desc", language)}
          </p>
          <div className="mt-12 space-y-5 text-white/90">
            <div className="flex items-center gap-4 animate-slide-right" style={{ animationDelay: "0.4s" }}>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-xl">📚</span>
              </div>
              <span className="text-lg">{t("login.feature_1", language)}</span>
            </div>
            <div className="flex items-center gap-4 animate-slide-right" style={{ animationDelay: "0.5s" }}>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-xl">💡</span>
              </div>
              <span className="text-lg">{t("login.feature_2", language)}</span>
            </div>
            <div className="flex items-center gap-4 animate-slide-right" style={{ animationDelay: "0.6s" }}>
              <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <span className="text-xl">📝</span>
              </div>
              <span className="text-lg">{t("login.feature_3", language)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div 
        className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-gradient-to-br from-gray-50 to-blue-50/30 relative overflow-hidden"
        suppressHydrationWarning
      >
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-100/60 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-blue-200/40 rounded-full blur-3xl translate-y-1/2 pointer-events-none animate-pulse-slow" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/4 left-0 w-48 h-48 bg-indigo-100/40 rounded-full blur-3xl -translate-x-1/2 pointer-events-none animate-pulse-slow" style={{ animationDelay: "2s" }} />
        
        <div className="relative z-10 w-full max-w-md animate-fade-in-up" suppressHydrationWarning>
          {!showForgot ? (
            <LoginForm
              callbackUrl={searchParams?.get("callbackUrl")}
              onForgotPassword={() => setShowForgot(true)}
              onSuccess={() => {
                const cb = searchParams?.get("callbackUrl") || "/dashboard-metrics"
                window.location.replace(cb)
              }}
            />
          ) : (
            <ForgotPasswordForm onBackToLogin={() => setShowForgot(false)} />
          )}
        </div>
      </div>
    </div>
  )
}