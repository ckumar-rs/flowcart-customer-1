'use client';

import { Feedback } from '@/types';
import { Star } from 'lucide-react';
import ReviewSentimentBadge from './ReviewSentimentBadge';

interface ReviewCardProps {
  review: Feedback;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < (review.rating || 0)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white">
            {review.rating || 0}/5
          </span>
          {review.comment && (
            <ReviewSentimentBadge reviewText={review.comment} showDetails={true} />
          )}
        </div>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>
      {review.comment && (
        <p className="text-gray-700 dark:text-gray-300 text-sm mt-2">{review.comment}</p>
      )}
    </div>
  );
}

