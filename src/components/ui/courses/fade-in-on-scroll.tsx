'use client'

import React, { useEffect, useRef, useState } from 'react'

interface FadeInOnScrollProps {
  children: React.ReactNode
  threshold?: number
  triggerOnce?: boolean
}

export const FadeInOnScroll: React.FC<FadeInOnScrollProps> = ({
  children,
  threshold = 0.2,
  triggerOnce = true,
}) => {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce && ref.current) {
            observer.unobserve(ref.current)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        threshold,
        rootMargin: '50px',
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current)
      }
    }
  }, [threshold, triggerOnce])

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0.3,
        transition: 'opacity 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      {children}
    </div>
  )
}
