import React from "react"
import { PlusCircle, Edit2, Trash2 } from "lucide-react"
import { Popconfirm } from "antd"

interface ContentBankItemProps {
  icon: React.ReactNode
  title: string
  meta: string
  onAdd: () => void
  onEdit?: () => void
  onDelete?: () => void
}

export default function ContentBankItem({
  icon,
  title,
  meta,
  onAdd,
  onEdit,
  onDelete,
}: ContentBankItemProps) {
  return (
    <div className="group flex items-center justify-between p-2 bg-white border rounded shadow-sm hover:shadow-md transition-shadow mb-2">
      {/* Phần thông tin (Bên trái) */}
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <span className="text-blue-600 flex-shrink-0">{icon}</span>
        <div className="flex-1 overflow-hidden">
          <p className="text-sm font-medium m-0 truncate" title={title}>
            {title}
          </p>
          <p className="text-xs text-gray-500 m-0">{meta}</p>
        </div>
      </div>

      {/* Phần Action Buttons (Bên phải - Hiện khi hover) */}
      <div className="flex items-center gap-1 pl-2">
        {/* Nút Edit */}
        {onEdit && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
        )}

        {/* Nút Delete (Có xác nhận Popconfirm) */}
        {onDelete && (
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Popconfirm
              title="Delete this item?"
              description="Are you sure to delete this content?"
              onConfirm={(e) => {
                e?.stopPropagation()
                onDelete()
              }}
              onCancel={(e) => e?.stopPropagation()}
              okText="Yes"
              cancelText="No"
            >
              <button
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            </Popconfirm>
          </div>
        )}

        {/* Nút Add (Luôn hiện) */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="text-blue-500 hover:text-blue-700 p-1 rounded-full hover:bg-blue-50 transition-colors ml-1"
          title="Add to Curriculum"
        >
          <PlusCircle size={18} />
        </button>
      </div>
    </div>
  )
}
