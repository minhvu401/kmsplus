"use client"

import React, { useState, useCallback } from "react"
import { Input, Button } from "antd"
import { SearchOutlined } from "@ant-design/icons"
import useLanguageStore, { type Language } from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

interface CourseSearchHeroProps {
  onSearch: (query: string) => void
}

export const CourseSearchHero: React.FC<CourseSearchHeroProps> = ({
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState("")
  const { language: rawLanguage } = useLanguageStore()
  const language = rawLanguage as Language

  const handleSearch = useCallback(() => {
    onSearch(searchQuery)
  }, [searchQuery, onSearch])

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #3366CC 0%, #2563EB 100%)",
        padding: "50px 20px",
        position: "relative",
        overflow: "hidden",
        minHeight: "200px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Layer 1: Main Background Gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(51, 102, 204, 0.95) 0%, rgba(37, 99, 235, 1) 100%)",
          zIndex: 1,
        }}
      />

      {/* Layer 2: Floating Decorative Circles */}
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.05)",
          top: "-100px",
          right: "-100px",
          zIndex: 2,
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.08)",
          bottom: "-50px",
          left: "-80px",
          zIndex: 2,
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background: "rgba(255, 255, 255, 0.03)",
          top: "50%",
          left: "10%",
          zIndex: 2,
          animation: "pulse-glow 6s ease-in-out infinite",
        }}
      />

      {/* Layer 3: Grid Pattern Overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.05,
          backgroundImage: `
            linear-gradient(0deg, rgba(255,255,255,.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)
          `,
          backgroundSize: "50px 50px",
          zIndex: 2,
          pointerEvents: "none",
        }}
      />

      {/* Layer 4: Decorative Tech Elements */}
      <div
        style={{
          position: "absolute",
          top: "80px",
          right: "60px",
          width: "120px",
          height: "120px",
          borderRadius: "20px",
          border: "2px solid rgba(255, 255, 255, 0.15)",
          zIndex: 2,
          animation: "rotate-slow 20s linear infinite",
          transform: "rotate(45deg)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "80px",
          left: "60px",
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          border: "2px solid rgba(255, 255, 255, 0.2)",
          zIndex: 2,
          animation: "bounce-gentle 4s ease-in-out infinite",
        }}
      />

      {/* Layer 5: Human Illustration Area */}
      <div
        style={{
          position: "absolute",
          right: "5%",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 3,
          opacity: 0.85,
          animation: "slide-in-right 1s ease-out",
        }}
      >
        {/* Simplified Human Figure SVG */}
        <svg
          width="200"
          height="250"
          viewBox="0 0 280 350"
          style={{
            filter: "drop-shadow(0 20px 40px rgba(0,0,0,0.2))",
          }}
        >
          {/* Head */}
          <circle cx="140" cy="60" r="35" fill="rgba(255,255,255,0.15)" />
          <circle cx="140" cy="60" r="32" fill="rgba(255,255,255,0.25)" />

          {/* Body */}
          <ellipse
            cx="140"
            cy="140"
            rx="45"
            ry="60"
            fill="rgba(255,255,255,0.2)"
          />
          <ellipse
            cx="140"
            cy="135"
            rx="42"
            ry="55"
            fill="rgba(255,255,255,0.3)"
          />

          {/* Left Arm raised */}
          <line
            x1="95"
            y1="110"
            x2="60"
            y2="80"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <circle cx="60" cy="80" r="16" fill="rgba(255,255,255,0.2)" />

          {/* Right Arm */}
          <line
            x1="185"
            y1="120"
            x2="220"
            y2="140"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <circle cx="220" cy="140" r="14" fill="rgba(255,255,255,0.18)" />

          {/* Left Leg */}
          <line
            x1="120"
            y1="200"
            x2="110"
            y2="300"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <rect
            x="105"
            y="300"
            width="10"
            height="25"
            fill="rgba(255,255,255,0.2)"
            rx="5"
          />

          {/* Right Leg */}
          <line
            x1="160"
            y1="200"
            x2="170"
            y2="300"
            stroke="rgba(255,255,255,0.22)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <rect
            x="165"
            y="300"
            width="10"
            height="25"
            fill="rgba(255,255,255,0.2)"
            rx="5"
          />

          {/* Accent Elements */}
          <circle
            cx="140"
            cy="60"
            r="38"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="2"
          />
          <path
            d="M 95 180 Q 100 220 120 250"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>

      {/* Layer 6: Content (Headline + Search) */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          maxWidth: "700px",
          margin: "0 auto",
          marginRight: "auto",
        }}
      >
        {/* Main Headline */}
        <h1
          style={{
            fontSize: "40px",
            fontWeight: 800,
            color: "#ffffff",
            marginBottom: "8px",
            lineHeight: "1.1",
            animation: "fade-in-up 0.8s ease-out",
            zIndex: 10,
            position: "relative",
          }}
        >
          {t("course.hero_title", language)}
        </h1>

        {/* Supporting Text */}
        <p
          style={{
            fontSize: "14px",
            color: "rgba(255, 255, 255, 0.95)",
            marginBottom: "28px",
            lineHeight: "1.5",
            animation: "fade-in-up 1s ease-out 0.2s both",
          }}
        >
          {t("course.hero_subtitle", language)}
        </p>

        {/* Search Bar Container */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            maxWidth: "600px",
            animation: "fade-in-up 1.2s ease-out 0.4s both",
            justifyContent: "flex-start",
          }}
        >
          <div
            style={{
              flex: "0 1 auto",
              position: "relative",
              boxShadow: "0 30px 60px rgba(0, 0, 0, 0.3)",
              borderRadius: "12px",
              transition: "transform 0.3s, box-shadow 0.3s",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = "translateY(-4px)"
              el.style.boxShadow = "0 40px 80px rgba(0, 0, 0, 0.35)"
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement
              el.style.transform = "translateY(0)"
              el.style.boxShadow = "0 30px 60px rgba(0, 0, 0, 0.3)"
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "18px",
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
              }}
            >
              <SearchOutlined
                style={{
                  fontSize: "18px",
                  color: "#60a5fa",
                  fontWeight: "bold",
                }}
              />
            </div>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={t("course.hero_search_placeholder", language)}
              variant="borderless"
              size="large"
              style={{
                paddingRight: "300px",
                fontSize: "15px",
                borderRadius: "12px",
                height: "55px",
                backgroundColor: "#ffffff",
                fontWeight: 500,
              }}
            />
          </div>

          <Button
            type="primary"
            size="large"
            onClick={handleSearch}
            style={{
              flex: "0 0 auto",
              paddingInline: "32px",
              minWidth: "120px",
              backgroundColor: "#ffffff",
              borderColor: "#ffffff",
              color: "#3366cc",
              fontSize: "15px",
              fontWeight: 700,
              height: "54px",
              borderRadius: "12px",
              transition: "all 0.3s",
              boxShadow: "0 10px 30px rgba(255, 255, 255, 0.2)",
            }}
            className="hover:!bg-blue-50 hover:!text-blue-700 hover:shadow-lg"
          >
            {t("course.hero_search_button", language)}
          </Button>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-30px) translateX(20px);
          }
          50% {
            transform: translateY(-60px) translateX(0px);
          }
          75% {
            transform: translateY(-30px) translateX(-20px);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 20px rgba(255,255,255,0.1), 0 0 40px rgba(255,255,255,0.05);
          }
          50% {
            box-shadow: 0 0 40px rgba(255,255,255,0.2), 0 0 80px rgba(255,255,255,0.1);
          }
        }

        @keyframes rotate-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes bounce-gentle {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(100px) translateY(-50%);
          }
          to {
            opacity: 0.85;
            transform: translateX(0) translateY(-50%);
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
