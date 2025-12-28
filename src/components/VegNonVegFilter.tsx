'use client';

import { useState } from 'react';
import { Leaf, UtensilsCrossed } from 'lucide-react';
import { motion } from 'framer-motion';

export type VegFilterOption = 'all' | 'veg' | 'non-veg';

interface VegNonVegFilterProps {
  value: VegFilterOption;
  onChange: (value: VegFilterOption) => void;
}

export default function VegNonVegFilter({ value, onChange }: VegNonVegFilterProps) {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2 bg-white dark:bg-gray-800 rounded-xl p-1 sm:p-1.5 border border-gray-200 dark:border-gray-700 shadow-sm">
      <button
        onClick={() => onChange('all')}
        className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
          value === 'all'
            ? 'bg-primary-600 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        {value === 'all' && (
          <motion.div
            layoutId="activeFilter"
            className="absolute inset-0 bg-primary-600 rounded-lg"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <span className="relative z-10">All</span>
      </button>

      <button
        onClick={() => onChange('veg')}
        className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
          value === 'veg'
            ? 'bg-green-600 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        {value === 'veg' && (
          <motion.div
            layoutId="activeFilter"
            className="absolute inset-0 bg-green-600 rounded-lg"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <Leaf className={`w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 ${value === 'veg' ? 'text-white' : 'text-green-600'}`} />
        <span className="relative z-10">Veg</span>
      </button>

      <button
        onClick={() => onChange('non-veg')}
        className={`relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 ${
          value === 'non-veg'
            ? 'bg-red-600 text-white shadow-md'
            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
        }`}
      >
        {value === 'non-veg' && (
          <motion.div
            layoutId="activeFilter"
            className="absolute inset-0 bg-red-600 rounded-lg"
            initial={false}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <UtensilsCrossed className={`w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10 ${value === 'non-veg' ? 'text-white' : 'text-red-600'}`} />
        <span className="relative z-10">Non-Veg</span>
      </button>
    </div>
  );
}

