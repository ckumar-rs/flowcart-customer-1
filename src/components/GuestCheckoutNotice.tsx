'use client';

import Link from 'next/link';
import { Info } from 'lucide-react';

interface GuestCheckoutNoticeProps {
  onDismiss?: () => void;
}

export default function GuestCheckoutNotice({ onDismiss }: GuestCheckoutNoticeProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm text-blue-900">
            <strong>Guest Checkout:</strong> You can place orders without logging in. 
            <Link href="/login" className="text-blue-600 hover:underline ml-1">
              Login
            </Link>
            {' '}for faster checkout and order history.
          </p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Dismiss
          </button>
        )}
      </div>
    </div>
  );
}

