'use client'

import { Select } from 'antd'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

interface PageSizeSelectorProps {
    currentPageSize: number
}

export default function PageSizeSelector({
    currentPageSize,
}: PageSizeSelectorProps) {
    const pathname = usePathname()
    const searchParams = useSearchParams()
    const router = useRouter()

    const handleChangePageSize = (value: number) => {
        const params = new URLSearchParams(searchParams)
        params.set('limit', value.toString())
        params.set('page', '1')
        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 font-medium">Items per page:</span>
            <Select
                value={currentPageSize}
                onChange={handleChangePageSize}
                style={{ width: 80, fontSize: "14px" }}
                options={[
                    { label: '5', value: 5 },
                    { label: '10', value: 10 },
                    { label: '20', value: 20 },
                    { label: '50', value: 50 },
                    { label: '100', value: 100 },
                ]}
            />
        </div>
    )
}
