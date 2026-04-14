"use client"

import React from "react"

interface PdfViewerProps {
  url: string
  className?: string
}

export default function PdfViewer({ url, className }: PdfViewerProps) {
  return (
    <div className={className || "w-full"}>
      <div className="w-full h-[800px] bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
        <iframe
          src={url}
          className="w-full h-full"
          title="PDF Viewer"
          frameBorder="0"
        />
      </div>

      <div className="mt-3">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-white text-gray-700 px-4 py-2 rounded-full shadow-md font-medium hover:bg-gray-50 border border-gray-100"
        >
          📖 Open PDF
        </a>
      </div>
    </div>
  )
}
