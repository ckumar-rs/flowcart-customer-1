'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cartStore';
import { businessService } from '@/services/businessService';
import { sessionService } from '@/services/sessionService';
import toast from 'react-hot-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * QR Code Route Handler
 * This page processes QR codes containing business IDs
 * It validates the business, stores it in session/cache, and redirects to the catalog
 */
export default function QRCodeHandlerPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  const { setBusiness: setCartBusiness } = useCartStore();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (!businessId) {
      setStatus('error');
      setErrorMessage('Invalid QR code: Business ID not found');
      return;
    }

    handleQRCode(businessId);
  }, [businessId]);

  const handleQRCode = async (id: string) => {
    try {
      setStatus('loading');

      // Validate business exists
      const business = await businessService.getById(id);

      if (!business) {
        throw new Error('Business not found');
      }

      // Create/update session using session service
      sessionService.createSession(id, undefined, business);

      // Set business in cart store (this also clears cart if switching businesses)
      setCartBusiness(id);

      // 3. Set status to success
      setStatus('success');

      // Show success message
      toast.success(`Welcome to ${business.name}!`, {
        icon: '✅',
        duration: 2000,
      });

      // Redirect to catalog after a brief delay
      setTimeout(() => {
        router.push(`/catalog/${id}`);
      }, 1000);

    } catch (error: any) {
      console.error('Error processing QR code:', error);
      setStatus('error');
      setErrorMessage(error.response?.data?.message || error.message || 'Failed to process QR code');
      toast.error('Invalid QR code or business not found');
      
      // Redirect to home after error
      setTimeout(() => {
        router.push('/');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-2xl p-8 max-w-md w-full border border-gray-200/50 dark:border-gray-700/50 text-center"
      >
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              Processing QR Code...
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Validating business and setting up your session
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <CheckCircle className="w-16 h-16 text-green-500 dark:text-green-400 mx-auto mb-4" />
            </motion.div>
            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              Success!
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Redirecting to business catalog...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-red-600 dark:text-red-400 mb-2">
              Error
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {errorMessage || 'Failed to process QR code'}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Redirecting to home page...
            </p>
          </>
        )}
      </motion.div>
    </div>
  );
}

