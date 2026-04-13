'use client'

import React from 'react'
import { Button } from 'antd'
import { ArrowRightOutlined, FileTextOutlined, QuestionCircleOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'

interface CTAPromoProps {
  type: 'articles' | 'qa'
  title: string
  description: string
  buttonText: string
  href: string
}

export const CTAPromo: React.FC<CTAPromoProps> = ({
  type,
  title,
  description,
  buttonText,
  href,
}) => {
  const router = useRouter()

  // Color scheme based on type
  const colorScheme = type === 'articles' 
    ? {
        bgGradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        accentColor: '#667eea',
        icon: FileTextOutlined,
      }
    : {
        bgGradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        accentColor: '#f5576c',
        icon: QuestionCircleOutlined,
      }

  const Icon = colorScheme.icon

  return (
    <section style={{ marginBottom: '80px', marginTop: '60px' }}>
      <div
        style={{
          background: colorScheme.bgGradient,
          borderRadius: '16px',
          padding: '60px 40px',
          position: 'relative',
          overflow: 'hidden',
          color: '#ffffff',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onClick={() => router.push(href)}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(-4px)'
          el.style.boxShadow = '0 30px 60px rgba(0, 0, 0, 0.3)'
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement
          el.style.transform = 'translateY(0)'
          el.style.boxShadow = 'none'
        }}
      >
        {/* Background Pattern */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.08,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            pointerEvents: 'none',
          }}
        />

        {/* Floating Circle Decoration */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-30px',
            left: '-30px',
            width: '150px',
            height: '150px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.08)',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: '40px' }}>
          {/* Icon */}
          <div
            style={{
              fontSize: '80px',
              opacity: 0.3,
              flexShrink: 0,
            }}
          >
            <Icon />
          </div>

          {/* Text Content */}
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: '36px',
                fontWeight: 800,
                margin: '0 0 12px 0',
                lineHeight: '1.2',
              }}
            >
              {title}
            </h2>
            <p
              style={{
                fontSize: '16px',
                margin: '0 0 24px 0',
                lineHeight: '1.6',
                opacity: 0.95,
                maxWidth: '500px',
              }}
            >
              {description}
            </p>

            {/* CTA Button */}
            <Button
              size="large"
              onClick={(e) => {
                e.stopPropagation()
                router.push(href)
              }}
              style={{
                backgroundColor: '#ffffff',
                color: colorScheme.accentColor,
                fontSize: '15px',
                fontWeight: 700,
                height: '48px',
                paddingInline: '32px',
                borderRadius: '8px',
                border: 'none',
                transition: 'all 0.3s',
              }}
              className="hover:!bg-gray-100 hover:!shadow-lg"
              icon={<ArrowRightOutlined />}
              iconPosition="end"
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
