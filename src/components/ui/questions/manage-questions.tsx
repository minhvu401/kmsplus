'use client'

import Link from 'next/link'
import { Table, Tag, Typography } from 'antd'
import type { TableProps } from 'antd'
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

export default function ManageQuestionsTable({
	questions,
}: {
	questions: Question[]
}) {
	const columns: TableProps<Question>['columns'] = [
		{
			title: 'Title',
			dataIndex: 'title',
			width: 260,
			render: (_text: string, record) => (
				<Link href={`/questions/${record.id}`} className="hover:underline">
					<Text title={record.title}>{truncateText(record.title, 60)}</Text>
				</Link>
			),
		},
		{
			title: 'Author',
			dataIndex: 'user_name',
			width: 180,
			render: (name: string) => <Text title={name}>{truncateText(name, 30)}</Text>,
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
	]

	return (
		<Table
			columns={columns}
			dataSource={questions}
			rowKey="id"
			scroll={{ x: 1000 }}
			pagination={false}
			locale={{ emptyText: 'No questions found' }}
		/>
	)
}
