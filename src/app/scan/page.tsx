'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, QrCode, X, AlertCircle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';
import { useCartStore } from '@/stores/cartStore';
import { businessService } from '@/services/businessService';
import { sessionService } from '@/services/sessionService';

/**
 * QR Code Scanner Page
 * Allows users to scan QR codes containing business IDs
 */
export default function QRScannerPage() {
  const router = useRouter();
  const { setBusiness: setCartBusiness } = useCartStore();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerElementRef = useRef<HTMLDivElement>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string>('');
  const [scannedBusinessId, setScannedBusinessId] = useState<string | null>(null);

  useEffect(() => {
    // Check for camera permission on mount
    checkCameraPermission();

    return () => {
      stopScanner();
    };
  }, []);

  const checkCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setHasPermission(true);
    } catch (err) {
      setHasPermission(false);
      setError('Camera permission denied. Please enable camera access to scan QR codes.');
    }
  };

  const startScanner = async () => {
    try {
      setError('');
      setIsScanning(true);

      if (!scannerElementRef.current) {
        throw new Error('Scanner element not found');
      }

      const scannerId = 'qr-scanner';
      scannerElementRef.current.innerHTML = `<div id="${scannerId}"></div>`;

      // Initialize Html5Qrcode
      const html5QrCode = new Html5Qrcode(scannerId);
      scannerRef.current = html5QrCode;

      // Start scanning
      await html5QrCode.start(
        {
          facingMode: 'environment', // Use back camera on mobile
        },
        {
          fps: 10, // Frames per second
          qrbox: { width: 250, height: 250 }, // Scanning area
        },
        (decodedText) => {
          // QR code detected
          handleQRCodeDetected(decodedText);
        },
        (errorMessage) => {
          // Error or no QR code found (ignore)
          // This is called frequently when no QR code is detected
        }
      );

      setHasPermission(true);
    } catch (err: any) {
      console.error('Error starting scanner:', err);
      setError(err.message || 'Failed to start camera. Please check permissions.');
      setIsScanning(false);
      setHasPermission(false);
      
      // Clean up on error
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
      scannerRef.current = null;
    }

    if (scannerElementRef.current) {
      scannerElementRef.current.innerHTML = '';
    }

    setIsScanning(false);
  };

  const handleQRCodeDetected = async (decodedText: string) => {
    // Stop scanner immediately
    await stopScanner();

    // Try to extract business ID from the decoded text
    // QR code format: could be just the business ID, or a URL like /qr/{businessId}
    let businessId = decodedText.trim();

    // If it's a URL, extract the business ID
    if (businessId.includes('/qr/')) {
      const match = businessId.match(/\/qr\/([a-f0-9-]+)/i);
      if (match && match[1]) {
        businessId = match[1];
      }
    }

    // Validate it looks like a GUID
    const guidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!guidRegex.test(businessId)) {
      toast.error('Invalid QR code format. Please scan a valid business QR code.');
      return;
    }

    // Process the business ID
    await processBusinessId(businessId);
  };

  const processBusinessId = async (id: string) => {
    try {
      // Validate business exists
      const business = await businessService.getById(id);

      if (!business) {
        throw new Error('Business not found');
      }

      // Create/update session using session service
      sessionService.createSession(id, undefined, business);

      // Set business in cart store (this also clears cart if switching businesses)
      setCartBusiness(id);
      setScannedBusinessId(id);

      toast.success(`Welcome to ${business.name}!`, {
        icon: '✅',
      });

      // Redirect to catalog
      setTimeout(() => {
        router.push(`/catalog/${id}`);
      }, 1000);

    } catch (error: any) {
      console.error('Error processing business ID:', error);
      toast.error('Invalid QR code or business not found. Please try again.');
    }
  };

  const handleManualInput = async (businessId: string) => {
    if (!businessId.trim()) {
      toast.error('Please enter a business ID');
      return;
    }

    await processBusinessId(businessId.trim());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="inline-block mb-4"
          >
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 rounded-2xl p-4 shadow-lg">
              <QrCode className="w-12 h-12 text-white" />
            </div>
          </motion.div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-2">
            Scan QR Code
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Scan a business QR code to access their menu and place orders
          </p>
        </div>

        {/* Scanner Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50 mb-6">
          {!isScanning ? (
            <div className="text-center space-y-4">
              {hasPermission === false && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-1">
                        Camera Permission Required
                      </p>
                      <p className="text-xs text-yellow-700 dark:text-yellow-400">
                        Please enable camera access in your browser settings to scan QR codes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
                  <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={startScanner}
                disabled={hasPermission === false}
                className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                <Camera className="w-5 h-5" />
                Start Scanner
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative bg-black rounded-xl overflow-hidden min-h-[400px] flex items-center justify-center">
                <div ref={scannerElementRef} id="qr-scanner-container" className="w-full h-full" />
                
                {/* Scanning overlay instructions */}
                <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10">
                  <p className="text-white text-sm font-semibold bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg inline-block">
                    Point camera at QR code
                  </p>
                </div>
              </div>

              <button
                onClick={stopScanner}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Stop Scanner
              </button>
            </div>
          )}
        </div>

        {/* Manual Input Fallback */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-gray-700/50">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            Or Enter Business ID Manually
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            If you have a business ID, you can enter it directly
          </p>
          <ManualBusinessIdInput onSubmit={handleManualInput} />
        </div>

        {/* Success Message */}
        <AnimatePresence>
          {scannedBusinessId && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 flex items-center gap-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  Business ID validated successfully!
                </p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  Redirecting to catalog...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Manual Business ID Input Component
function ManualBusinessIdInput({ onSubmit }: { onSubmit: (businessId: string) => void }) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(input.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter Business ID (e.g., 123e4567-e89b-12d3-a456-426614174000)"
        className="flex-1 px-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all duration-200 text-sm"
        disabled={loading}
      />
      <button
        type="submit"
        disabled={!input.trim() || loading}
        className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Validating...' : 'Go'}
      </button>
    </form>
  );
}

