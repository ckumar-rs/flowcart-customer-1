'use client';

import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortOption = 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'default';

interface ProductSortProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

export default function ProductSort({ value, onChange }: ProductSortProps) {
  const options: { value: SortOption; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'name-asc', label: 'Name (A-Z)' },
    { value: 'name-desc', label: 'Name (Z-A)' },
    { value: 'price-asc', label: 'Price (Low to High)' },
    { value: 'price-desc', label: 'Price (High to Low)' },
  ];

  return (
    <div className="flex items-center gap-2 w-full sm:w-auto">
      <ArrowUpDown className="w-4 h-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-xs sm:text-sm font-medium bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

