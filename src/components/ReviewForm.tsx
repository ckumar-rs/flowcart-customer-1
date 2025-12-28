'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { reviewService, ReviewRequest } from '@/services/reviewService';
import { useAuthStore } from '@/stores/authStore';

interface ReviewFormProps {
  orderId?: string;
  productId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function ReviewForm({
  orderId,
  productId,
  onSuccess,
  onCancel,
}: ReviewFormProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get customer phone from user object or localStorage
    if (isAuthenticated && user) {
      // Try to get phone from user object first
      const phone = (user as any).phone || 
        (typeof window !== 'undefined' ? localStorage.getItem('customer_phone') : null) || 
        '';
      setCustomerPhone(phone);
    } else if (!isAuthenticated && typeof window !== 'undefined') {
      // If not authenticated, redirect to login
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    }
  }, [isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isAuthenticated || !user) {
      toast.error('Please login to submit a review');
      router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!customerPhone) {
      setError('Phone number is required. Please update your profile with a phone number.');
      return;
    }

    try {
      setSubmitting(true);
      const reviewData: ReviewRequest = {
        orderId,
        productId,
        customerPhone,
        rating,
        comment: comment.trim() || undefined,
      };

      await reviewService.submitReview(reviewData);
      toast.success('Review submitted successfully!');
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to submit review';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isAuthenticated || !user) {
    return null; // Will redirect in useEffect
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!customerPhone && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-2">
            Phone number is required to submit a review. Please update your profile with a phone number.
          </p>
          <button
            type="button"
            onClick={() => router.push('/dashboard/settings')}
            className="text-sm text-yellow-800 dark:text-yellow-300 font-semibold hover:underline"
          >
            Update Profile →
          </button>
        </div>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Rating
        </label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
          Comment (Optional)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Share your experience..."
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-lg font-medium hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={submitting || rating === 0 || !customerPhone}
          className="flex-1 bg-primary-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

