'use client';

import { Pagination } from 'antd';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Flex } from 'antd';

export default function PaginationBar({ totalPages }: { totalPages: number }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPage = Number(searchParams.get('page')) || 1;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <Flex justify="end" style={{ marginTop: 32 }}>
      <Pagination
        current={currentPage}
        total={totalPages * 10} // AntD expects total items, not total pages
        pageSize={10} // so 10 * totalPages = total items
        onChange={handlePageChange}
        showSizeChanger={false}
        showLessItems
      />
    </Flex>
  );
}
