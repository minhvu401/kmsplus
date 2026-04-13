'use client'

import React, { useState } from 'react'
import { Table, Tag, Typography, Avatar, Button, Tooltip, Modal, message, Form, Input, Select, Divider, Card, Segmented } from 'antd'
import type { TableProps } from 'antd'
import { EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons'
import { useRouter } from 'next/navigation'
import RichTextEditor from '@/components/ui/RichTextEditor'
import { FilterCategory, FilterStatus, SortBy } from '@/components/ui/questions/filters'
import {
	deleteQuestionForManagement,
	updateQuestionForManagement,
	closeQuestionForManagement,
	openQuestionForManagement,
} from '@/action/question/questionActions'
import type { Question } from '@/service/question.service'

const { Text } = Typography

const truncateText = (text: string, maxLength: number) => {
	if (!text) return ''
	return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text
}

const formatDate = (dateString: string | Date) => {
	const date = new Date(dateString)
	const day = String(date.getDate()).padStart(2, '0')
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const year = date.getFullYear()
	return `${day}/${month}/${year}`
}

const getInitials = (name: string) => {
	return (
		name
			.split(' ')
			.filter(Boolean)
			.slice(0, 2)
			.map((part) => part[0]?.toUpperCase())
			.join('') || 'U'
	)
}

export default function ManageQuestionsTable({
	questions,
	categories,
}: {
	questions: Question[]
	categories: { id: number; name: string }[]
}) {
	const router = useRouter()
	const [messageApi, contextHolder] = message.useMessage()
	const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
	const [deleting, setDeleting] = useState(false)
	const [isEditVisible, setEditVisible] = useState(false)
	const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)
	const [savingEdit, setSavingEdit] = useState(false)
	const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null)
	const [statusTarget, setStatusTarget] = useState<{ id: number; isClosed: boolean } | null>(null)
	const [updatingStatus, setUpdatingStatus] = useState(false)
	const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
	const [form] = Form.useForm()

	const handleDelete = async () => {
		if (!deleteTargetId) return

		setDeleting(true)
		const result = await deleteQuestionForManagement(String(deleteTargetId))
		setDeleting(false)

		if (result.success) {
			messageApi.success(result.message || 'Question deleted successfully')
			setDeleteTargetId(null)
			router.refresh()
			return
		}

		messageApi.error(result.message || 'Failed to delete question')
	}

	const openEditModal = (record: Question) => {
		const normalizedCategoryId =
			record.category_id === null || record.category_id === undefined
				? undefined
				: String(record.category_id)

		setEditingQuestion(record)
		form.setFieldsValue({
			title: record.title,
			content: record.content,
			category_id: normalizedCategoryId,
		})
		setEditVisible(true)
	}

	const handleSaveEdit = async () => {
		if (!editingQuestion) return

		const values = await form.validateFields()
		const formData = new FormData()
		formData.append('id', String(editingQuestion.id))
		formData.append('title', values.title)
		formData.append('content', values.content)
		formData.append('category_id', String(values.category_id))

		setSavingEdit(true)
		const result = await updateQuestionForManagement(formData)
		setSavingEdit(false)

		if (result.success) {
			messageApi.success(result.message || 'Question updated successfully')
			setEditVisible(false)
			setEditingQuestion(null)
			form.resetFields()
			router.refresh()
			return
		}

		messageApi.error(result.message || 'Failed to update question')
	}

	const handleToggleStatus = async () => {
		if (!statusTarget) return

		setUpdatingStatus(true)
		const result = statusTarget.isClosed
			? await openQuestionForManagement(String(statusTarget.id))
			: await closeQuestionForManagement(String(statusTarget.id))
		setUpdatingStatus(false)

		if (result.success) {
			messageApi.success(result.message)
			setStatusTarget(null)
			router.refresh()
			return
		}

		messageApi.error(result.message || 'Failed to update question status')
	}

	const renderActionButtons = (record: Question, withText = false) => {
		if (!withText) {
			return (
				<div className="flex items-center gap-1 whitespace-nowrap">
					<Tooltip title="Edit question">
						<Button
							type="text"
							icon={<EditOutlined />}
							size="small"
							className="text-blue-600 hover:!text-blue-700 hover:bg-blue-50"
							onClick={(e) => {
								e.stopPropagation()
								openEditModal(record)
							}}
						/>
					</Tooltip>
					<Tooltip title={record.is_closed ? 'Open question' : 'Close question'}>
						<Button
							type="text"
							icon={record.is_closed ? <UnlockOutlined /> : <LockOutlined />}
							size="small"
							className={record.is_closed ? 'text-green-600 hover:!text-green-700 hover:bg-green-50' : 'text-orange-600 hover:!text-orange-700 hover:bg-orange-50'}
							onClick={(e) => {
								e.stopPropagation()
								setStatusTarget({ id: Number(record.id), isClosed: record.is_closed })
							}}
						/>
					</Tooltip>
					<Tooltip title="Delete question">
						<Button
							type="text"
							danger
							icon={<DeleteOutlined />}
							size="small"
							className="hover:bg-red-50"
							onClick={(e) => {
								e.stopPropagation()
								setDeleteTargetId(Number(record.id))
							}}
						/>
					</Tooltip>
				</div>
			)
		}

		return (
			<div className="space-y-2">
				<div className={withText ? 'flex gap-2' : ''}>
					<Tooltip title="Edit question">
						<Button
							type="text"
							icon={<EditOutlined />}
							size="small"
							className={withText ? 'flex-1 text-blue-600 hover:!text-blue-700 hover:bg-blue-50' : 'text-blue-600 hover:!text-blue-700 hover:bg-blue-50'}
							onClick={(e) => {
								e.stopPropagation()
								openEditModal(record)
							}}
						>
							{withText ? 'Edit' : null}
						</Button>
					</Tooltip>
					<Tooltip title="Delete question">
						<Button
							type="text"
							danger
							icon={<DeleteOutlined />}
							size="small"
							className={withText ? 'flex-1 hover:bg-red-50' : 'hover:bg-red-50'}
							onClick={(e) => {
								e.stopPropagation()
								setDeleteTargetId(Number(record.id))
							}}
						>
							{withText ? 'Delete' : null}
						</Button>
					</Tooltip>
				</div>
				<div className={withText ? 'flex gap-2' : ''}>
					<Tooltip title={record.is_closed ? 'Open question' : 'Close question'}>
						<Button
							type="text"
							icon={record.is_closed ? <UnlockOutlined /> : <LockOutlined />}
							size="small"
							className={
								withText
									? `w-full ${record.is_closed ? 'text-green-600 hover:!text-green-700 hover:bg-green-50' : 'text-orange-600 hover:!text-orange-700 hover:bg-orange-50'}`
									: record.is_closed
										? 'text-green-600 hover:!text-green-700 hover:bg-green-50'
										: 'text-orange-600 hover:!text-orange-700 hover:bg-orange-50'
							}
							onClick={(e) => {
								e.stopPropagation()
								setStatusTarget({ id: Number(record.id), isClosed: record.is_closed })
							}}
						>
							{withText ? (record.is_closed ? 'Open' : 'Close') : null}
						</Button>
					</Tooltip>
				</div>
			</div>
		)
	}

	const columns: TableProps<Question>['columns'] = [
		{
			title: 'Title',
			dataIndex: 'title',
			width: 260,
			onCell: () => ({
				style: {
					whiteSpace: 'normal',
					wordBreak: 'break-word',
				},
			}),
			render: (_text: string, record) => (
				<button
					type="button"
					className="p-0 text-left text-blue-600 hover:text-blue-700 hover:underline whitespace-normal break-words leading-5"
					onClick={() => setPreviewQuestion(record)}
					title={record.title}
				>
					{record.title}
				</button>
			),
		},
		{
			title: 'Author',
			dataIndex: 'user_name',
			width: 180,
			render: (_name: string, record) => {
				const authorName = record.user_name || 'Unknown user'
				const authorAvatar = record.user_avatar || undefined

				return (
					<div className="flex items-center gap-3">
						<Avatar
							src={authorAvatar}
							size={32}
							className="!rounded-full shrink-0"
							style={{ minWidth: 32, minHeight: 32 }}
						>
							{!authorAvatar ? getInitials(authorName) : null}
						</Avatar>
						<Text title={authorName}>{truncateText(authorName, 30)}</Text>
					</div>
				)
			},
		},
		{
			title: 'Category',
			dataIndex: 'category_name',
			width: 160,
			render: (name: string) => <Tag color="blue">{name}</Tag>,
		},
		{
			title: 'Status',
			dataIndex: 'is_closed',
			width: 120,
			render: (isClosed: boolean) => (
				<Tag color={isClosed ? 'red' : 'green'}>
					{isClosed ? 'Closed' : 'Open'}
				</Tag>
			),
		},
		{
			title: 'Create Date',
			dataIndex: 'created_at',
			width: 140,
			render: (date: string) => formatDate(date),
		},
		{
			title: 'Update Date',
			dataIndex: 'updated_at',
			width: 140,
			render: (date: string) => formatDate(date),
		},
		{
			title: 'Actions',
			key: 'actions',
			width: 160,
			render: (_: unknown, record) => renderActionButtons(record),
		},
	]

	return (
		<>
			{contextHolder}
			<div className="flex items-center gap-14 mb-4 flex-wrap">
				<FilterCategory categories={categories} />
				<FilterStatus />
				<SortBy />
				<div className="flex items-center gap-3">
					<label className="text-sm font-semibold text-gray-700 whitespace-nowrap">
						View mode:
					</label>
					<Segmented
						size="middle"
						value={viewMode}
						onChange={(value) => setViewMode(value as 'list' | 'grid')}
						options={[
							{ label: 'List', value: 'list' },
							{ label: 'Grid', value: 'grid' },
						]}
					/>
				</div>
			</div>
			{viewMode === 'list' ? (
				<Table
					columns={columns}
					dataSource={questions}
					rowKey="id"
					scroll={{ x: 1120 }}
					pagination={false}
					locale={{ emptyText: 'No questions found' }}
				/>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
					{questions.map((record) => {
						return (
							<Card
								key={record.id}
								title={
									<button
										type="button"
										onClick={() => setPreviewQuestion(record)}
											className="block w-full text-left text-blue-600 hover:text-blue-700 hover:underline whitespace-nowrap overflow-hidden text-ellipsis"
										title={record.title}
									>
										{record.title}
									</button>
								}
									styles={{
										header: { paddingBottom: 0 },
										body: { paddingTop: 0 },
									}}
								className="shadow-sm"
							>
								<div className="space-y-3">
									<div className="flex items-center gap-3">
										<Avatar
											src={record.user_avatar || undefined}
											size={28}
											className="!rounded-full shrink-0"
											style={{ minWidth: 28, minHeight: 28 }}
										>
											{!record.user_avatar ? getInitials(record.user_name || 'Unknown user') : null}
										</Avatar>
										<Text className="!mb-0">{record.user_name || 'Unknown user'}</Text>
									</div>
									<div className="flex flex-wrap gap-2">
										<Tag color="blue">{record.category_name}</Tag>
										<Tag color={record.is_closed ? 'red' : 'green'}>
											{record.is_closed ? 'Closed' : 'Open'}
										</Tag>
									</div>
									<div className="text-xs text-gray-500 flex justify-between">
										<span>
											Created: <span className="font-semibold text-gray-700">{formatDate(record.created_at)}</span>
										</span>
										<span>
											Updated: <span className="font-semibold text-gray-700">{formatDate(record.updated_at)}</span>
										</span>
									</div>
									{renderActionButtons(record, true)}
								</div>
							</Card>
						)
					})}
					{questions.length === 0 && (
						<div className="col-span-full text-center text-gray-500 py-8">No questions found</div>
					)}
				</div>
			)}
			<Modal
				title="Confirmation"
				centered
				open={deleteTargetId !== null}
				onCancel={() => setDeleteTargetId(null)}
				onOk={handleDelete}
				okText="Delete"
				okButtonProps={{ danger: true, loading: deleting }}
			>
				<Text>Are you sure you want to delete this question?</Text>
				<br />
				<Text type="secondary">This question will be archived.</Text>
			</Modal>
			<Modal
				title="Confirmation"
				centered
				open={statusTarget !== null}
				onCancel={() => setStatusTarget(null)}
				onOk={handleToggleStatus}
				okText={statusTarget?.isClosed ? 'Open' : 'Close'}
				okButtonProps={{ danger: !statusTarget?.isClosed, loading: updatingStatus }}
			>
				<Text>
					{statusTarget?.isClosed
						? 'Are you sure you want to open this question?'
						: 'Are you sure you want to close this question?'}
				</Text>
				<br />
				<Text type="secondary">
					{statusTarget?.isClosed
						? 'Question will be reopened for discussion.'
						: 'Question will be closed and no new answers should be added.'}
				</Text>
			</Modal>
			<Modal
				title="Question Preview"
				centered
				width={760}
				open={previewQuestion !== null}
				onCancel={() => setPreviewQuestion(null)}
				footer={[
					<Button
						key="view-full"
						type="primary"
						onClick={() => {
							if (!previewQuestion) return
							router.push(`/questions/${previewQuestion.id}`)
						}}
					>
						View Full Question
					</Button>,
					<Button key="close" onClick={() => setPreviewQuestion(null)}>
						Close
					</Button>,
				]}
			>
				{previewQuestion && (
					<div className="space-y-4">
						<div>
							<Text type="secondary">Title</Text>
							<div className="font-semibold text-base text-gray-900">{previewQuestion.title}</div>
						</div>
						<div className="flex flex-wrap items-center gap-2">
							<Tag color="blue">{previewQuestion.category_name}</Tag>
							<Tag color={previewQuestion.is_closed ? 'red' : 'green'}>
								{previewQuestion.is_closed ? 'Closed' : 'Open'}
							</Tag>
							<Text type="secondary">By {previewQuestion.user_name}</Text>
						</div>
						<Divider style={{ margin: '8px 0' }} />
						<div>
							<Text type="secondary">Content</Text>
							<div
								className="mt-2 prose max-w-none"
								dangerouslySetInnerHTML={{ __html: previewQuestion.content || '' }}
							/>
						</div>
					</div>
				)}
			</Modal>
			<Modal
				title="Edit Question"
				centered
				width={760}
				open={isEditVisible}
				onCancel={() => {
					setEditVisible(false)
					setEditingQuestion(null)
					form.resetFields()
				}}
				onOk={handleSaveEdit}
				okText="Save"
				okButtonProps={{ loading: savingEdit }}
			>
				<Form form={form} layout="vertical">
					<Form.Item
						label={<Text strong>Title:</Text>}
						name="title"
						rules={[
							{ required: true, message: 'Please enter a title' },
							{ min: 3, message: 'Title must be at least 3 characters' },
						]}
					>
						<Input maxLength={150} placeholder="Write your question title here..." />
					</Form.Item>

					<Divider style={{ margin: '8px 0 16px' }} />

					<Form.Item
						label={<Text strong>Content:</Text>}
						name="content"
						rules={[
							{ required: true, message: 'Please provide more details' },
							{
								validator: (_, value) => {
									if (!value) return Promise.resolve()
									const plainText = String(value)
										.replace(/<[^>]*>/g, '')
										.replace(/&nbsp;/g, ' ')
										.trim()
									if (plainText.length > 0 && plainText.length < 10) {
										return Promise.reject(new Error('Content must be at least 10 characters'))
									}
									if (plainText.length > 3000) {
										return Promise.reject(new Error('Content must be under 3000 characters'))
									}
									return Promise.resolve()
								},
							},
						]}
					>
						<RichTextEditor placeholder="Provide more details about your question..." />
					</Form.Item>

					<Divider style={{ margin: '8px 0 16px' }} />

					<Form.Item
						label={<Text strong>Category:</Text>}
						name="category_id"
						rules={[{ required: true, message: 'Please select a category' }]}
					>
						<Select
							placeholder="Select category"
							options={categories.map((cat) => ({
								label: cat.name,
								value: String(cat.id),
							}))}
							allowClear
							size="large"
						/>
					</Form.Item>
				</Form>
			</Modal>
		</>
	)
}
