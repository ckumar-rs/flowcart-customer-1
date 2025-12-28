'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Apple, Info } from 'lucide-react';
import { NutritionInfo as NutritionInfoType } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface NutritionInfoProps {
  nutritionInfo?: NutritionInfoType;
  productName: string;
}

export default function NutritionInfo({ nutritionInfo, productName }: NutritionInfoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!nutritionInfo) return null;

  const {
    calories,
    protein,
    carbohydrates,
    fat,
    fiber,
    sugar,
    sodium,
    servingSize,
    servingsPerContainer,
    vitamins,
    minerals,
    allergens,
  } = nutritionInfo;

  // Calculate daily value percentages (based on 2000 calorie diet)
  const getDailyValue = (value: number, dailyValue: number): number => {
    return Math.round((value / dailyValue) * 100);
  };

  const nutritionFacts = [
    { label: 'Calories', value: calories, unit: 'kcal', dailyValue: 2000 },
    { label: 'Total Fat', value: fat, unit: 'g', dailyValue: 65 },
    { label: 'Saturated Fat', value: nutritionInfo.saturatedFat, unit: 'g', dailyValue: 20 },
    { label: 'Trans Fat', value: nutritionInfo.transFat, unit: 'g', dailyValue: 0 },
    { label: 'Cholesterol', value: nutritionInfo.cholesterol, unit: 'mg', dailyValue: 300 },
    { label: 'Sodium', value: sodium, unit: 'mg', dailyValue: 2400 },
    { label: 'Total Carbohydrate', value: carbohydrates, unit: 'g', dailyValue: 300 },
    { label: 'Dietary Fiber', value: fiber, unit: 'g', dailyValue: 25 },
    { label: 'Total Sugars', value: sugar, unit: 'g', dailyValue: 50 },
    { label: 'Protein', value: protein, unit: 'g', dailyValue: 50 },
  ].filter(item => item.value !== undefined && item.value !== null);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden shadow-lg">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/30 rounded-lg flex items-center justify-center">
            <Apple className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="text-left">
            <h3 className="font-bold text-gray-900 dark:text-white text-base">Nutrition Information</h3>
            {servingSize && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Serving Size: {servingSize}
                {servingsPerContainer && ` • ${servingsPerContainer} servings`}
              </p>
            )}
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500 dark:text-gray-400" />
        )}
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-4 pt-0 space-y-4">
              {/* Nutrition Facts Table */}
              <div className="border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <div className="bg-gray-900 dark:bg-gray-950 text-white p-3 border-b-4 border-gray-900 dark:border-gray-800">
                  <h4 className="font-black text-xl">Nutrition Facts</h4>
                  {servingSize && (
                    <p className="text-sm mt-1">
                      Serving size: <span className="font-bold">{servingSize}</span>
                    </p>
                  )}
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {nutritionFacts.map((fact, index) => {
                    const dailyValue = fact.dailyValue ? getDailyValue(fact.value || 0, fact.dailyValue) : null;
                    const isBold = ['Calories', 'Total Fat', 'Total Carbohydrate', 'Protein'].includes(fact.label);
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-between px-3 py-2 ${
                          isBold ? 'bg-gray-50 dark:bg-gray-700/30' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <span className={`text-sm ${isBold ? 'font-bold' : 'font-medium'} text-gray-900 dark:text-white`}>
                            {fact.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-900 dark:text-white">
                            {fact.value}
                            <span className="text-xs font-normal ml-1 text-gray-600 dark:text-gray-400">
                              {fact.unit}
                            </span>
                          </span>
                          {dailyValue !== null && fact.label !== 'Calories' && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 min-w-[3rem] text-right">
                              {dailyValue}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Vitamins & Minerals */}
              {(vitamins && Object.keys(vitamins).length > 0) || (minerals && Object.keys(minerals).length > 0) ? (
                <div className="space-y-3">
                  {vitamins && Object.keys(vitamins).length > 0 && (
                    <div>
                      <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Vitamins</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(vitamins).map(([vitamin, value]) => (
                          <div
                            key={vitamin}
                            className="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                          >
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{vitamin}</span>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {minerals && Object.keys(minerals).length > 0 && (
                    <div>
                      <h5 className="font-semibold text-sm text-gray-900 dark:text-white mb-2">Minerals</h5>
                      <div className="grid grid-cols-2 gap-2">
                        {Object.entries(minerals).map(([mineral, value]) => (
                          <div
                            key={mineral}
                            className="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg"
                          >
                            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{mineral}</span>
                            <span className="text-xs font-bold text-purple-600 dark:text-purple-400">{value}mg</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}

              {/* Allergens */}
              {allergens && allergens.length > 0 && (
                <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold text-sm text-yellow-900 dark:text-yellow-200 mb-1">
                        Contains Allergens
                      </h5>
                      <div className="flex flex-wrap gap-2">
                        {allergens.map((allergen, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 rounded text-xs font-medium"
                          >
                            {allergen}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Disclaimer */}
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                * Percent Daily Values are based on a 2,000 calorie diet. Your daily values may be higher or lower depending on your calorie needs.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

