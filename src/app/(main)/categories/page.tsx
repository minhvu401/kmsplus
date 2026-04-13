'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spin } from 'antd';

export default function CategoriesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/categories/management');
  }, [router]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <Spin size="large" />
    </div>
  );
}
