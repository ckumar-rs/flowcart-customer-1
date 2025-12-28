'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { QrCode, ArrowRight } from 'lucide-react';
import { Business } from '@/types';
import { businessService } from '@/services/businessService';
import { useCartStore } from '@/stores/cartStore';
import { sessionService } from '@/services/sessionService';

export default function HomePage() {
  const router = useRouter();
  const [businessId, setBusinessId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if business ID is stored in localStorage
    // If found, auto-redirect to catalog (business menu/dashboard)
    const storedBusinessId = sessionService.getCurrentBusinessId();
    if (storedBusinessId) {
      router.push(`/catalog/${storedBusinessId}`);
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate business ID format (should be a GUID)
      const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!guidRegex.test(businessId)) {
        setError('Please enter a valid Business ID');
        setLoading(false);
        return;
      }

      // Verify business exists
      const business = await businessService.getById(businessId);
      
      // Create/update session using session service
      sessionService.createSession(businessId, undefined, business);

      // Set business in cart store (this also clears cart if switching businesses)
      useCartStore.getState().setBusiness(businessId);
      
      // Redirect to catalog
      router.push(`/catalog/${businessId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Business not found. Please check the Business ID.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(29,130,142,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(29,130,142,0.1),transparent_50%)]" />
      
      <div className="max-w-2xl w-full mx-4 relative z-10">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20 dark:border-gray-700/50">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 mb-3">
              FlowCart
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base">
              Access any restaurant or hotel menu
            </p>
          </div>

          {/* Two Options: QR Scan and Manual Entry */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* QR Code Scanner Option */}
            <Link
              href="/scan"
              className="group relative bg-gradient-to-br from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 rounded-xl p-6 text-white hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl overflow-hidden"
            >
              <div className="relative z-10">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 w-fit mb-4">
                  <QrCode className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-black mb-2">Scan QR Code</h2>
                <p className="text-sm text-primary-100">
                  Point your camera at the restaurant's QR code
                </p>
              </div>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            </Link>

            {/* Manual Entry Option */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border-2 border-gray-200 dark:border-gray-600">
              <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full p-3 w-fit mb-4">
                <ArrowRight className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                Enter Business ID
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                If you have a Business ID, enter it below
              </p>
            </div>
          </div>

          {/* Manual Entry Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="businessId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2.5">
                Business ID
              </label>
              <input
                id="businessId"
                type="text"
                value={businessId}
                onChange={(e) => setBusinessId(e.target.value)}
                placeholder="Enter Business ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
                className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200 text-sm"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                You can find this on the restaurant's menu or ask staff
              </p>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !businessId.trim()}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white py-3 px-4 rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl relative overflow-hidden group"
            >
              <span className="relative z-10">
                {loading ? 'Validating...' : 'Continue to Menu'}
              </span>
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium">Two ways to get started:</p>
            <p className="mt-1">Scan the QR code at the restaurant or enter the Business ID provided by staff</p>
          </div>
        </div>
      </div>
    </div>
  );
}

