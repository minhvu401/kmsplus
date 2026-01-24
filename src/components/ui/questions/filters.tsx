'use client';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Select, Flex, Typography } from 'antd';

type Category = {
    id: number;
    name: string;
}

const { Text } = Typography;

//------------------------------- CATEGORY FILTER ---------------------------------
export function FilterCategory({ categories }: { categories: Category[] }) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();

    const currentCategory = searchParams.get('category') || 'any';
    const [selected, setSelected] = useState(currentCategory);

    useEffect(() => {
        setSelected(currentCategory);
    }, [currentCategory]);

    const handleChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', '1');

        if (value === 'any') {
            params.delete('category');
        } else {
            params.set('category', value);
        }

        replace(`${pathname}?${params.toString()}`);
        setSelected(value);
    };

    return (
        <Flex align="center" gap={8}>
            <Text strong>Category:</Text>
            <Select
                value={selected}
                onChange={handleChange}
                style={{ width: 180 }}
                size="middle"
                options={[
                    { label: 'Any', value: 'any' },
                    ...categories.map((cat) => ({ label: cat.name, value: cat.id })),
                ]}
            />
        </Flex>
    );
}

// -------------------- STATUS FILTER --------------------
export function FilterStatus() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentStatus = searchParams.get('status') || 'any';
  const [selected, setSelected] = useState(currentStatus);

  useEffect(() => {
    setSelected(currentStatus);
  }, [currentStatus]);

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');

    if (value === 'any') {
      params.delete('status');
    } else {
      params.set('status', value);
    }

    replace(`${pathname}?${params.toString()}`);
    setSelected(value);
  };

  return (
    <Flex align="center" gap={8}>
      <Text strong>Status:</Text>
      <Select
        value={selected}
        onChange={handleChange}
        style={{ width: 160 }}
        size="middle"
        options={[
          { label: 'Any', value: 'any' },
          { label: 'Open', value: 'open' },
          { label: 'Closed', value: 'closed' },
        ]}
      />
    </Flex>
  );
}

// -------------------- SORT FILTER --------------------
export function QuestionsSortBy() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  const currentSortCondition = searchParams.get('sort') || 'newest';
  const [selected, setSelected] = useState(currentSortCondition);

  useEffect(() => {
    setSelected(currentSortCondition);
  }, [currentSortCondition]);

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    params.set('sort', value);

    replace(`${pathname}?${params.toString()}`);
    setSelected(value);
  };

  return (
    <Flex align="center" gap={8}>
      <Text strong>Sort by:</Text>
      <Select
        value={selected}
        onChange={handleChange}
        style={{ width: 180 }}
        size="middle"
        options={[
          { label: 'Newest', value: 'newest' },
          { label: 'Most Answers', value: 'most-answers' },
        ]}
      />
    </Flex>
  );
}