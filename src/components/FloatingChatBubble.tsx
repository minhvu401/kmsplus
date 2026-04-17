"use client"

import React, { useState, useEffect } from "react"
import {
  MessageOutlined,
  CloseOutlined,
  HistoryOutlined,
  EllipsisOutlined,
  DeleteOutlined,
  EditOutlined,
} from "@ant-design/icons"
import { Button, Tooltip, Dropdown, Spin, Empty, Modal, Input } from "antd"
import type { MenuProps } from "antd"
import ChatBox from "./ChatBox"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

interface Conversation {
  id: number
  title: string | null
  createdAt: string
  updatedAt: string
}

export default function FloatingChatBubble() {
  const language = useLanguageStore((state) => state.language)
  const [isOpen, setIsOpen] = useState(false)
  const [showHistoryDrawer, setShowHistoryDrawer] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [currentConversation, setCurrentConversation] =
    useState<Conversation | null>(null)
  const [listLoading, setListLoading] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [conversationToDelete, setConversationToDelete] =
    useState<Conversation | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [conversationToRename, setConversationToRename] =
    useState<Conversation | null>(null)
  const [newTitle, setNewTitle] = useState("")
  const [renameLoading, setRenameLoading] = useState(false)
  const chatBoxRef = React.useRef<any>(null)

  // Load conversations when history drawer opens
  useEffect(() => {
    if (showHistoryDrawer) {
      loadConversations()
    }
  }, [showHistoryDrawer])

  const loadConversations = async () => {
    try {
      setListLoading(true)
      const res = await fetch("/api/chat", {
        credentials: "include",
      })

      if (!res.ok) throw new Error("Failed to load conversations")

      const data = await res.json()
      setConversations(data.data || [])
    } catch (error) {
      console.error("Error loading conversations:", error)
      setConversations([])
    } finally {
      setListLoading(false)
    }
  }

  const handleNewConversation = () => {
    // Reset ChatBox first to avoid state race conditions
    chatBoxRef.current?.handleNewConversation?.()
    // Then update FloatingChatBubble state
    setCurrentConversation(null)
    setShowHistoryDrawer(false)
  }

  const handleSelectConversation = (conv: Conversation) => {
    setCurrentConversation(conv)
    setShowHistoryDrawer(false)
  }

  const handleDeleteClick = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation() // Prevent conversation selection when clicking delete
    setConversationToDelete(conv)
    setDeleteModalOpen(true)
  }

  const handleRenameClick = (e: React.MouseEvent, conv: Conversation) => {
    e.stopPropagation() // Prevent conversation selection when clicking rename
    setConversationToRename(conv)
    setNewTitle(conv.title || "")
    setRenameModalOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return

    try {
      setDeleteLoading(true)
      const res = await fetch(`/api/chat/${conversationToDelete.id}`, {
        method: "DELETE",
        credentials: "include",
      })

      if (!res.ok) {
        throw new Error("Failed to delete conversation")
      }

      // Remove from conversations list
      setConversations((prev) =>
        prev.filter((conv) => conv.id !== conversationToDelete.id)
      )

      // If deleted conversation was selected, reset to null
      if (currentConversation?.id === conversationToDelete.id) {
        setCurrentConversation(null)
        // Also sync ChatBox state to null
        chatBoxRef.current?.setCurrentConversation?.(null)
      }

      setDeleteModalOpen(false)
      setConversationToDelete(null)
    } catch (error) {
      console.error("Error deleting conversation:", error)
      Modal.error({
        title: t("chat.delete_failed_title", language),
        content: t("chat.delete_failed_msg", language),
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleConfirmRename = async () => {
    if (!conversationToRename || !newTitle.trim()) return

    try {
      setRenameLoading(true)
      const res = await fetch(`/api/chat/${conversationToRename.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ title: newTitle.trim() }),
      })

      if (!res.ok) {
        throw new Error("Failed to rename conversation")
      }

      const updatedConversation = await res.json()

      // Update in conversations list
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === conversationToRename.id
            ? {
                ...conv,
                title: updatedConversation.data?.title || newTitle.trim(),
              }
            : conv
        )
      )

      // Update current conversation if it's the one being renamed
      if (currentConversation?.id === conversationToRename.id) {
        setCurrentConversation({
          ...currentConversation,
          title: updatedConversation.data?.title || newTitle.trim(),
        })
      }

      setRenameModalOpen(false)
      setConversationToRename(null)
      setNewTitle("")
    } catch (error) {
      console.error("Error renaming conversation:", error)
      Modal.error({
        title: t("chat.rename_failed_title", language),
        content: t("chat.rename_failed_msg", language),
      })
    } finally {
      setRenameLoading(false)
    }
  }

  return (
    <>
      {/* Floating Chat Bubble - Like Facebook */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center text-2xl z-50"
          title={t("chat.title", language)}
        >
          <MessageOutlined />
        </button>
      )}

      {isOpen && (
        <div
          className="fixed bottom-0 right-6 w-96 bg-white rounded-t-2xl shadow-2xl flex flex-col z-50 animate-fade-in border border-gray-200"
          style={{
            height: "calc(78vh - 23px)",
            maxHeight: "calc(78vh - 23px)",
          }}
        >
          {/* Header with buttons */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
            <div>
              <h3 className="font-bold text-md">
                {t("chat.header_title", language)}
              </h3>
              <p className="text-xs text-blue-100">
                {t("chat.header_subtitle", language)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Dropdown
                menu={
                  {
                    items: [
                      {
                        key: "new-conversation",
                        label: t("chat.new_conversation", language),
                        onClick: handleNewConversation,
                      },
                    ],
                  } as MenuProps
                }
              >
                <Tooltip title={t("common.select", language)}>
                  <Button
                    type="text"
                    icon={<EllipsisOutlined />}
                    className="text-lg !text-white hover:!bg-blue-700"
                  />
                </Tooltip>
              </Dropdown>
              <Tooltip title={t("sidebar.learning_history", language)}>
                <Button
                  type="text"
                  icon={<HistoryOutlined />}
                  onClick={() => setShowHistoryDrawer(true)}
                  className="text-lg !text-white hover:!bg-blue-700"
                />
              </Tooltip>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-700 p-1 rounded-full transition-colors"
                title={t("chat.close", language)}
              >
                <CloseOutlined className="text-lg" />
              </button>
            </div>
          </div>

          {/* Chat Content - Ẩn khi mở history drawer */}
          {!showHistoryDrawer && (
            <div className="flex-1 overflow-hidden">
              <ChatBox
                ref={chatBoxRef}
                isModal={true}
                hideHeader={true}
                initialConversation={currentConversation}
              />
            </div>
          )}

          {/* History Drawer - Overlay toàn bộ chat area */}
          {showHistoryDrawer && (
            <div className="flex-1 overflow-hidden bg-white">
              <div className="p-4 space-y-2 h-full overflow-auto">
                {listLoading ? (
                  <Spin />
                ) : conversations.length === 0 ? (
                  <Empty description={t("empty.no_data", language)} />
                ) : (
                  conversations?.map((conv) => (
                    <div
                      key={conv.id}
                      className={`p-3 rounded-lg cursor-pointer transition-all group flex items-center justify-between ${
                        currentConversation?.id === conv.id
                          ? "bg-blue-100 border border-blue-400"
                          : "bg-gray-100 hover:bg-gray-200"
                      }`}
                      onClick={() => handleSelectConversation(conv)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm truncate text-gray-900">
                          {conv.title || t("chat.new_conversation", language)}
                        </div>
                        <div className="text-xs text-gray-700">
                          {new Date(conv.createdAt).toLocaleDateString(
                            "vi-VN",
                            {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            }
                          )}
                        </div>
                      </div>
                      <Dropdown
                        menu={
                          {
                            items: [
                              {
                                key: "rename",
                                label: t("chat.rename", language) || "Rename",
                                icon: <EditOutlined />,
                                onClick: (info) =>
                                  handleRenameClick(info.domEvent as any, conv),
                              },
                              {
                                key: "delete",
                                label: t("common.delete", language),
                                icon: <DeleteOutlined />,
                                danger: true,
                                onClick: (info) =>
                                  handleDeleteClick(info.domEvent as any, conv),
                              },
                            ],
                          } as MenuProps
                        }
                      >
                        <Button
                          type="text"
                          size="small"
                          icon={<EllipsisOutlined />}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        title={t("modal.confirm", language)}
        open={deleteModalOpen}
        onCancel={() => {
          setDeleteModalOpen(false)
          setConversationToDelete(null)
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setDeleteModalOpen(false)
              setConversationToDelete(null)
            }}
          >
            {t("common.cancel", language)}
          </Button>,
          <Button
            key="delete"
            type="primary"
            danger
            loading={deleteLoading}
            onClick={handleConfirmDelete}
          >
            {t("common.delete", language)}
          </Button>,
        ]}
      >
        <p>
          {t("modal.are_you_sure", language)}? "
          <strong>
            {conversationToDelete?.title ||
              t("chat.new_conversation", language) ||
              "New Conversation"}
          </strong>
          "
        </p>
        <p className="text-gray-600 text-sm">
          {t("modal.this_action_cannot_be_undone", language)}
        </p>
      </Modal>

      {/* Rename Conversation Modal */}
      <Modal
        title={t("chat.rename", language) || "Rename Conversation"}
        open={renameModalOpen}
        onCancel={() => {
          setRenameModalOpen(false)
          setConversationToRename(null)
          setNewTitle("")
        }}
        footer={[
          <Button
            key="cancel"
            onClick={() => {
              setRenameModalOpen(false)
              setConversationToRename(null)
              setNewTitle("")
            }}
          >
            {t("common.cancel", language)}
          </Button>,
          <Button
            key="rename"
            type="primary"
            loading={renameLoading}
            onClick={handleConfirmRename}
            disabled={!newTitle.trim()}
          >
            {t("chat.rename", language) || "Rename"}
          </Button>,
        ]}
      >
        <div className="space-y-3">
          <p>
            {t("chat.enter_new_title", language) ||
              "Enter new name for conversation:"}
          </p>
          <Input
            placeholder={
              t("chat.conversation_title_placeholder", language) ||
              "Conversation name"
            }
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onPressEnter={handleConfirmRename}
            autoFocus
          />
        </div>
      </Modal>

      {/* Animation styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </>
  )
}
