"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Table,
  Button,
  Space,
  Tag,
  Drawer,
  Form,
  Input,
  Select,
  Popconfirm,
  message,
  notification,
  Card,
  Row,
  Col,
  Modal,
  Upload,
  Typography,
} from "antd"
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FolderAddOutlined,
  UploadOutlined,
  FilterOutlined,
  ClearOutlined,
  SearchOutlined,
} from "@ant-design/icons"
import { DatePicker } from "antd"
import type { UploadFile, UploadProps } from "antd/es/upload/interface"
import dayjs from "dayjs"

import QuillEditorLazy from "@/components/QuillEditorLazy"
import { DocumentStatus } from "@/enum/document-status.enum"
import useUserStore from "@/store/useUserStore"
import { Permission } from "@/enum/permission.enum"

import {
  fetchDocuments,
  fetchCategories,
  saveDocument,
  deleteDocument,
  getDocumentById,
  createCategory,
} from "@/action/documents/documentActions"
import { getAllDepartments } from "@/action/department/departmentActions"
import { hasAnyPermissionDynamic } from "@/service/rolePermission.service"
import { Role } from "@/enum/role.enum"
import useLanguageStore from "@/store/useLanguageStore"
import { t } from "@/lib/i18n"

// Types
interface Category {
  id: string
  name: string
  description?: string
  parent_id?: string | null
  department_id?: number | null
  department_name?: string | null
}

interface Department {
  id: number
  name: string
}

interface DocumentItem {
  id: string
  title: string
  status: DocumentStatus
  version: string
  updated_at: string
  category_name: string
  category_id: string
}

export default function DocumentManagementPage() {
  const router = useRouter()
  const { user, userRole } = useUserStore()

  // State: dữ liệu Table
  const [documents, setDocuments] = useState<DocumentItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // THÊM STATE LƯU THÔNG TIN USER
  const [currentUser, setCurrentUser] = useState<any>(null)

  // State: Drawer quản lý tạo/sửa Document
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [departments, setDepartments] = useState<Department[]>([])

  // State: Modal quản lý Danh mục
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false)

  // State: Filter
  const [filterStatus, setFilterStatus] = useState<string>("")
  const [filterCategory, setFilterCategory] = useState<string>("")
  const [filterDepartment, setFilterDepartment] = useState<string>("")
  const [filterSearch, setFilterSearch] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("updated_at_desc")
  const [hasActiveFilters, setHasActiveFilters] = useState(false)

  // Forms
  const [docForm] = Form.useForm()
  const [catForm] = Form.useForm()

  // Language hook
  const { language } = useLanguageStore()

  // Permission check on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (!userRole) {
        router.replace("/login")
        return
      }

      // Check if user has CREATE_DOCUMENT permission
      const hasPermission = await hasAnyPermissionDynamic(userRole as Role, [
        Permission.CREATE_DOCUMENT,
      ])

      if (!hasPermission) {
        message.error("Bạn không có quyền truy cập trang này")
        router.replace("/dashboard-metrics")
      }
    }

    checkPermission()
  }, [userRole, router])

  // 1. Khởi tạo: Lấy dữ liệu Documents & Categories & Phòng ban
  const loadData = async () => {
    setLoading(true)
    try {
      // Gọi thêm API lấy thông tin user hiện tại
      const authRes = await fetch("/api/auth/me")
      const authData = authRes.ok ? await authRes.json() : null
      const user = authData?.user

      const [docsData, catsData, deptsData] = await Promise.all([
        fetchDocuments(),
        fetchCategories(),
        getAllDepartments(),
      ])
      setCurrentUser(user)
      setDocuments(docsData)
      setCategories(catsData)

      // LỌC DROPDOWN PHÒNG BAN DỰA TRÊN ROLE
      if (user?.role === "ADMIN") {
        setDepartments(deptsData || [])
      } else if (user?.department?.head_of_department_id) {
        // HOD: Chỉ cho phép chọn phòng ban của chính họ
        const hodDeptId = user.department.head_of_department_id
        const filteredDepts = (deptsData || []).filter((d: Department) => {
          // Trả về đúng phòng ban mà user đang làm HOD
          return (
            String(hodDeptId) === String(user.id) && d.id === user.department_id
          ) // Chú ý user.department_id tuỳ DB trả về
        })

        // Nếu muốn đơn giản hơn: Chỉ cần lấy phòng ban của user
        const myDept = (deptsData || []).filter(
          (d: Department) => String(d.id) === String(user.department_id)
        )
        setDepartments(myDept)
      } else {
        setDepartments([])
      }
    } catch (error: any) {
      console.error("Lỗi:", error)
      message.error("Lỗi khởi tạo dữ liệu: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Track if filters are active
  useEffect(() => {
    const active =
      filterSearch !== "" ||
      filterStatus !== "" ||
      filterCategory !== "" ||
      filterDepartment !== ""
    setHasActiveFilters(active)
  }, [filterSearch, filterStatus, filterCategory, filterDepartment])

  // Filter & Sort Documents
  const getFilteredDocuments = () => {
    let filtered = documents

    // Filter by search text
    if (filterSearch) {
      filtered = filtered.filter((doc) =>
        doc.title.toLowerCase().includes(filterSearch.toLowerCase())
      )
    }

    // Filter by status
    if (filterStatus) {
      filtered = filtered.filter((doc) => doc.status === filterStatus)
    }

    // Filter by category
    if (filterCategory) {
      filtered = filtered.filter((doc) => doc.category_id === filterCategory)
    }

    // Filter by department (for ADMIN only)
    if (filterDepartment && currentUser?.role === "ADMIN") {
      filtered = filtered.filter((doc) => {
        const category = categories.find((c) => c.id === doc.category_id)
        return (
          category?.department_id === Number(filterDepartment) ||
          category?.department_id === null
        )
      })
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "updated_at_desc":
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        case "updated_at_asc":
          return (
            new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime()
          )
        case "title_asc":
          return a.title.localeCompare(b.title)
        case "title_desc":
          return b.title.localeCompare(a.title)
        default:
          return 0
      }
    })

    return filtered
  }

  // Clear all filters
  const handleClearFilters = () => {
    setFilterStatus("")
    setFilterCategory("")
    setFilterDepartment("")
    setFilterSearch("")
    setSortBy("updated_at_desc")
  }

  const filteredDocuments = getFilteredDocuments()

  // 2. Mở Drawer & Lấy chi tiết nội dung (nếu sửa)
  const openDrawer = async (docId?: string) => {
    setEditingId(docId || null)
    docForm.resetFields()
    setFileList([])
    setIsDrawerOpen(true)

    if (docId) {
      const hideMsg = message.loading("Đang tải dữ liệu...", 0)
      try {
        const detail = await getDocumentById(docId)
        if (detail) {
          docForm.setFieldsValue({
            title: detail.title,
            category_id: detail.category_id,
            status: detail.status,
            version: detail.version,
            content: detail.content,
          })
          if (detail.attachments && detail.attachments.length > 0) {
            setFileList(
              detail.attachments.map((att: any) => ({
                uid: String(att.id),
                name: att.file_name,
                url: att.file_url,
                size: att.file_size,
                type: att.file_type,
                status: "done",
              }))
            )
          }
        }
      } catch (error: any) {
        message.error(error.message)
        setIsDrawerOpen(false)
      } finally {
        hideMsg()
      }
    } else {
      // Giá trị mặc định khi Thêm mới
      docForm.setFieldsValue({
        status: DocumentStatus.DRAFT,
        version: "1.0",
      })
    }
  }

  // 3. Xử lý Lưu Document
  const handleSaveDoc = async () => {
    try {
      const values = await docForm.validateFields()
      setIsSubmitting(true)

      const finalAttachments = fileList
        .map((f) => {
          if (f.status === "done" && f.response) {
            return {
              file_name: f.name,
              file_url: f.response.url,
              file_size: f.response.bytes,
              file_type: f.response.format,
            }
          }
          if (f.status === "done" && f.url) {
            return {
              file_name: f.name,
              file_url: f.url,
              file_size: f.size,
              file_type: f.type,
            }
          }
          return null
        })
        .filter(Boolean) as any[]

      await saveDocument({
        id: editingId || undefined,
        ...values,
        attachments: finalAttachments,
      })
      message.success(
        editingId ? "Cập nhật thành công!" : "Tạo mới thành công!"
      )
      setIsDrawerOpen(false)
      loadData() // Refresh Table
    } catch (error: any) {
      if (!error.errorFields) message.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 4. Xóa Document
  const handleDeleteDoc = async (id: string) => {
    try {
      await deleteDocument(id)
      message.success("Đã xóa tài liệu")
      loadData()
    } catch (error: any) {
      message.error(error.message)
    }
  }

  // 5. Mở & Xử lý Lưu Category
  const handleSaveCategory = async () => {
    try {
      const values = await catForm.validateFields()
      setIsCategorySubmitting(true)
      await createCategory(values)
      notification.success({
        message: t("document.create_category_success", language),
        description:
          "Danh m?c v?a m?i du?c th�m th�nh c�ng v� hi?n th? b�n du?i.",
        placement: "topRight",
      })
      setIsCategoryModalOpen(false)
      catForm.resetFields()
      // Tải lại danh sách categories để cập nhật vào dropdown
      const catsData = await fetchCategories()
      setCategories(catsData)
    } catch (error: any) {
      if (!error.errorFields) message.error(error.message)
    } finally {
      setIsCategorySubmitting(false)
    }
  }

  // Render Table Columns
  const columns = [
    {
      title: t("document.table_title", language),
      dataIndex: "title",
      key: "title",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: t("document.table_category", language),
      dataIndex: "category_name",
      key: "category_name",
      render: (text: string, record: DocumentItem) => {
        const cat = categories.find((c) => c.id === record.category_id)
        const deptText = cat?.department_name ? ` (${cat.department_name})` : ""
        return (
          <Tag color="blue">
            {text || t("document.category_unknown", language)}
            {deptText}
          </Tag>
        )
      },
    },
    {
      title: t("document.table_version", language),
      dataIndex: "version",
      key: "version",
      width: 100,
    },
    {
      title: t("document.table_status", language),
      dataIndex: "status",
      key: "status",
      render: (status: DocumentStatus) => {
        const colorMap = {
          [DocumentStatus.DRAFT]: "orange",
          [DocumentStatus.PUBLISHED]: "green",
          [DocumentStatus.ARCHIVED]: "red",
        }
        return <Tag color={colorMap[status] || "default"}>{status}</Tag>
      },
    },
    {
      title: t("document.table_updated", language),
      dataIndex: "updated_at",
      key: "updated_at",
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: t("document.table_action", language),
      key: "action",
      width: 150,
      render: (_: any, record: DocumentItem) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => openDrawer(record.id)}
          />
          <Popconfirm
            title={t("document.delete_confirm", language)}
            description={t("document.delete_confirm_desc", language)}
            onConfirm={() => handleDeleteDoc(record.id)}
            okText={t("document.btn_delete", language)}
            cancelText={t("document.btn_cancel", language)}
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("document.page_title", language)}
          </h1>
          <p className="text-gray-500">{t("document.page_desc", language)}</p>
        </div>
        <Space>
          <Button
            icon={<FolderAddOutlined />}
            onClick={() => setIsCategoryModalOpen(true)}
          >
            {t("document.btn_add_category", language)}
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => openDrawer()}
          >
            {t("document.btn_add_document", language)}
          </Button>
        </Space>
      </div>

      <Card className="shadow-sm rounded-lg overflow-hidden mb-6">
        <div className="space-y-4">
          {/* Search Bar - Full Width */}
          <Input.Search
            placeholder={t("document.filter_search_placeholder", language)}
            prefix={<SearchOutlined />}
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            size="middle"
            allowClear
            enterButton={<SearchOutlined />}
            className="mb-2"
          />

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Status Filter */}
            <div className="flex flex-col">
              <Typography.Text
                type="secondary"
                className="text-sm font-medium mb-2"
              >
                {t("document.filter_status_placeholder", language)}
              </Typography.Text>
              <Select
                allowClear
                value={filterStatus || undefined}
                onChange={(value) => setFilterStatus(value)}
                size="middle"
                options={[
                  {
                    label: t("document.form_status_draft", language),
                    value: DocumentStatus.DRAFT,
                  },
                  {
                    label: t("document.form_status_published", language),
                    value: DocumentStatus.PUBLISHED,
                  },
                  {
                    label: t("document.form_status_archived", language),
                    value: DocumentStatus.ARCHIVED,
                  },
                ]}
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-col">
              <Typography.Text
                type="secondary"
                className="text-sm font-medium mb-2"
              >
                {t("document.filter_category_placeholder", language)}
              </Typography.Text>
              <Select
                allowClear
                value={filterCategory || undefined}
                onChange={(value) => setFilterCategory(value)}
                size="middle"
                showSearch
                optionFilterProp="label"
                options={categories.map((c) => ({
                  label: c.name,
                  value: c.id,
                }))}
              />
            </div>

            {/* Department Filter (ADMIN only) */}
            {currentUser?.role === "ADMIN" && (
              <div className="flex flex-col">
                <Typography.Text
                  type="secondary"
                  className="text-sm font-medium mb-2"
                >
                  {t("document.filter_department_placeholder", language)}
                </Typography.Text>
                <Select
                  allowClear
                  value={filterDepartment || undefined}
                  onChange={(value) => setFilterDepartment(value)}
                  size="middle"
                  showSearch
                  optionFilterProp="label"
                  options={departments.map((d) => ({
                    label: d.name,
                    value: String(d.id),
                  }))}
                />
              </div>
            )}

            {/* Sort Filter */}
            <div className="flex flex-col">
              <Typography.Text
                type="secondary"
                className="text-sm font-medium mb-2"
              >
                {t("document.sort_label", language)}
              </Typography.Text>
              <Select
                value={sortBy}
                onChange={(value) => setSortBy(value)}
                size="middle"
                options={[
                  {
                    label: t("document.sort_updated_newest", language),
                    value: "updated_at_desc",
                  },
                  {
                    label: t("document.sort_updated_oldest", language),
                    value: "updated_at_asc",
                  },
                  {
                    label: t("document.sort_title_asc", language),
                    value: "title_asc",
                  },
                  {
                    label: t("document.sort_title_desc", language),
                    value: "title_desc",
                  },
                ]}
              />
            </div>

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <div className="flex flex-col justify-end">
                <Button
                  type="dashed"
                  danger
                  size="small"
                  icon={<ClearOutlined />}
                  onClick={handleClearFilters}
                  className="w-full"
                >
                  {t("document.btn_clear_filter", language)}
                </Button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="flex justify-end items-center mt-2">
            <Typography.Text type="secondary" className="text-sm">
              {t("document.results_count", language).replace(
                "{count}",
                String(filteredDocuments.length)
              )}
            </Typography.Text>
          </div>
        </div>
      </Card>

      <Card className="shadow-sm rounded-lg overflow-hidden">
        <Table
          columns={columns}
          dataSource={filteredDocuments}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* DRAWER: Tạo/Sửa Document */}
      <Drawer
        title={
          editingId
            ? t("document.drawer_edit_title", language)
            : t("document.drawer_add_title", language)
        }
        width={900} /* Rộng hơn vì có Editor */
        onClose={() => setIsDrawerOpen(false)}
        open={isDrawerOpen}
        extra={
          <Space>
            <Button onClick={() => setIsDrawerOpen(false)}>
              {t("document.btn_cancel", language)}
            </Button>
            <Button
              type="primary"
              onClick={handleSaveDoc}
              loading={isSubmitting}
            >
              {t("document.btn_save", language)}
            </Button>
          </Space>
        }
      >
        <Form layout="vertical" form={docForm}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="title"
                label={t("document.form_title_label", language)}
                rules={[
                  {
                    required: true,
                    message: t("document.form_title_required", language),
                  },
                ]}
              >
                <Input
                  placeholder={t("document.form_title_placeholder", language)}
                  size="large"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="category_id"
                label={t("document.form_category_label", language)}
                rules={[
                  {
                    required: true,
                    message: t("document.form_category_required", language),
                  },
                ]}
              >
                <Select
                  showSearch
                  placeholder={t(
                    "document.form_category_placeholder",
                    language
                  )}
                  options={categories.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                  size="large"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="version"
                label={t("document.form_version_label", language)}
                rules={[{ required: true }]}
              >
                <Input placeholder="1.0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="status"
                label={t("document.form_status_label", language)}
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    {
                      label: t("document.form_status_draft", language),
                      value: DocumentStatus.DRAFT,
                    },
                    {
                      label: t("document.form_status_published", language),
                      value: DocumentStatus.PUBLISHED,
                    },
                    {
                      label: t("document.form_status_archived", language),
                      value: DocumentStatus.ARCHIVED,
                    },
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>

          {/* SỬ DỤNG QUILL EDITOR - LAZY IMPORT GÍUP CẢI THIỆN PERFORMANCE */}
          <Form.Item
            name="content"
            label={t("document.form_content_label", language)}
            rules={[
              {
                required: true,
                message: t("document.form_content_required", language),
              },
            ]}
            valuePropName="value"
          >
            <QuillEditorLazy
              value=""
              onChange={() => {}}
              height={450}
              placeholder={t("document.form_content_placeholder", language)}
            />
          </Form.Item>

          <Form.Item label={t("document.form_files_label", language)}>
            <Upload
              name="file"
              action="/api/upload/cloudinary"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              multiple
            >
              <Button icon={<UploadOutlined />}>
                {t("document.form_files_button", language)}
              </Button>
            </Upload>
          </Form.Item>
        </Form>
      </Drawer>

      {/* MODAL: Thêm Danh mục nhanh */}
      <Modal
        title={t("document.modal_add_category_title", language)}
        open={isCategoryModalOpen}
        onOk={handleSaveCategory}
        confirmLoading={isCategorySubmitting}
        onCancel={() => setIsCategoryModalOpen(false)}
      >
        <Form layout="vertical" form={catForm}>
          <Form.Item
            name="name"
            label={t("document.form_category_name_label", language)}
            rules={[
              {
                required: true,
                message: t("document.form_category_name_required", language),
              },
            ]}
          >
            <Input
              placeholder={t(
                "document.form_category_name_placeholder",
                language
              )}
            />
          </Form.Item>

          <Form.Item
            name="department_id"
            label={t("document.form_department_label", language)}
            tooltip={t("document.form_department_note", language)}
          >
            <Select
              allowClear
              showSearch
              placeholder={t("document.form_department_placeholder", language)}
              options={departments.map((d) => ({ label: d.name, value: d.id }))}
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={t("document.form_description_label", language)}
          >
            <Input.TextArea
              rows={3}
              placeholder={t("document.form_description_placeholder", language)}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
