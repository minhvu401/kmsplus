"use client"

import React, { useState, useCallback } from "react"
import { SearchOutlined } from "@ant-design/icons"
import useLanguageStore, { type Language } from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

interface ArticleSearchProps {
  onSearch: (query: string) => void
  placeholder?: string
  value?: string
}

export const ArticleSearch: React.FC<ArticleSearchProps> = ({
  onSearch,
  placeholder,
  value: initialValue = "",
}) => {
  const { language: rawLanguage } = useLanguageStore()
  const language = rawLanguage as Language
  const [value, setValue] = useState(initialValue)

  const searchPlaceholder =
    placeholder || t("article.search_placeholder", language)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value)
  }

  const handleSearch = () => {
    onSearch(value)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch()
    }
  }

  const handleClear = () => {
    setValue("")
    onSearch("")
  }

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        display: "flex",
        gap: "8px",
      }}
    >
      <div style={{ position: "relative", flex: 1 }}>
        <SearchOutlined
          style={{
            position: "absolute",
            left: "12px",
            top: "50%",
            transform: "translateY(-50%)",
            color: "#60a5fa",
            fontSize: "16px",
            zIndex: 1,
          }}
        />
        <input
          type="text"
          value={value}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          placeholder={searchPlaceholder}
          style={{
            width: "100%",
            paddingLeft: "36px",
            paddingRight: value ? "32px" : "12px",
            paddingTop: "8px",
            paddingBottom: "8px",
            border: "1px solid #e5e7eb",
            borderRadius: "0.375rem",
            fontSize: "13px",
            transition: "all 0.2s",
            boxSizing: "border-box",
            outline: "none",
            backgroundColor: "white",
            color: "#1f2937",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "#60a5fa"
            e.currentTarget.style.boxShadow =
              "0 0 0 1px rgba(96, 165, 250, 0.1)"
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "#e5e7eb"
            e.currentTarget.style.boxShadow = "none"
          }}
        />
        {value && (
          <button
            onClick={handleClear}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              background: "none",
              border: "none",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "14px",
              padding: 0,
              zIndex: 2,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#6b7280"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#9ca3af"
            }}
          >
            ✕
          </button>
        )}
      </div>
      <button
        onClick={handleSearch}
        style={{
          padding: "8px 16px",
          backgroundColor: "#2563eb",
          color: "white",
          border: "none",
          borderRadius: "0.375rem",
          fontSize: "13px",
          fontWeight: "500",
          cursor: "pointer",
          transition: "all 0.2s",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          whiteSpace: "nowrap",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#1d4ed8"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#2563eb"
        }}
      >
        <SearchOutlined style={{ fontSize: "14px" }} />
        {t("article.search_button", language)}
      </button>
    </div>
  )
}
