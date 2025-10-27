'use client'

import { useState, useEffect, useRef } from 'react'
import { EllipsisOutlined } from '@ant-design/icons'
import Link from 'next/link'

export default function QuestionMenu() {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={menuRef} className="relative inline-block text-left">
      {/* Icon button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-full hover:bg-gray-100"
      >
        <EllipsisOutlined className="text-2xl text-gray-400 hover:text-gray-600 cursor-pointer" />
      </button>

      {/* Dropdown menu */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-48 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 z-10 animate-fade-in"
        >
          <div className="py-1 text-sm text-gray-700">
            <Link
              href="/questions/edit"
              className="block px-4 py-2 hover:bg-gray-100"
            >
              ✏️ Edit question
            </Link>
            <button
              onClick={() => {
                alert('Delete clicked')
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              🗑️ Delete question
            </button>
            <button
              onClick={() => {
                alert('Close clicked')
                setOpen(false)
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100"
            >
              🚫 Close question
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
