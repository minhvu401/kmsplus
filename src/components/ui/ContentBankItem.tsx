import React from "react"
import { PlusCircle } from "lucide-react"

interface ContentBankItemProps {
  icon: React.ReactNode
  title: string
  meta: string
  onAdd: () => void
}

export default function ContentBankItem({
  icon,
  title,
  meta,
  onAdd,
}: ContentBankItemProps) {
  return (
    <div className="flex items-center justify-between p-2 bg-white border rounded shadow-sm">
      <div className="flex items-center gap-2 overflow-hidden">
        <span className="text-blue-600">{icon}</span>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium truncate">{title}</p>
          <p className="text-xs text-gray-500">{meta}</p>
        </div>
      </div>
      <button onClick={onAdd} className="text-blue-500 hover:text-blue-700 p-1">
        <PlusCircle size={18} />
      </button>
    </div>
  )
}
