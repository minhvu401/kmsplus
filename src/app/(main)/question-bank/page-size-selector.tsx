'use client';

import { Select } from 'antd';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/navigation';

interface PageSizeSelectorProps {
    currentPageSize: number;
}

export default function PageSizeSelector({ currentPageSize }: PageSizeSelectorProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const handleChangePageSize = (value: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('limit', value.toString());
        params.set('page', '1'); // Reset to page 1 when changing page size
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <Select
                value={currentPageSize}
                onChange={handleChangePageSize}
                style={{ width: 80 }}
                options={[
                    { label: '10', value: 10 },
                    { label: '20', value: 20 },
                    { label: '50', value: 50 },
                    { label: '100', value: 100 },
                ]}
            />
        </div>
    );
}
