'use client';

import { useState } from 'react';
import { MessageCircle, X, Phone, Mail, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function WhatsAppButton() {
  const [isOpen, setIsOpen] = useState(false);

  const whatsappNumber = '+15551234567'; // Replace with actual WhatsApp number
  const phoneNumber = '+15551234567';
  const email = 'support@flowcart.com';

  const handleWhatsAppClick = () => {
    const message = encodeURIComponent('Hello! I need help with FlowCart.');
    window.open(`https://wa.me/${whatsappNumber.replace(/\D/g, '')}?text=${message}`, '_blank');
  };

  const handlePhoneClick = () => {
    window.open(`tel:${phoneNumber}`, '_self');
  };

  const handleEmailClick = () => {
    window.open(`mailto:${email}?subject=FlowCart Support`, '_self');
  };

  return (
    <>
      {/* Floating WhatsApp Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 w-16 h-16 bg-gradient-to-r from-[#25D366] to-[#128C7E] rounded-full shadow-lg flex items-center justify-center text-white z-50 hover:shadow-xl transition-shadow"
        aria-label="Open WhatsApp menu"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
      </motion.button>

      {/* WhatsApp Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />

            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              className="fixed bottom-24 left-6 w-72 bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">Get in Touch</h3>
                    <p className="text-sm text-white/90">We're here to help!</p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="p-4 space-y-3">
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full flex items-center gap-3 p-4 bg-gradient-to-r from-[#25D366] to-[#128C7E] text-white rounded-xl hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MessageCircle className="w-6 h-6" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold">Chat on WhatsApp</p>
                    <p className="text-xs text-white/90">Instant support</p>
                  </div>
                  <ExternalLink className="w-5 h-5 opacity-70" />
                </button>

                <button
                  onClick={handlePhoneClick}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Phone className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">Call Us</p>
                    <p className="text-xs text-gray-600">{phoneNumber}</p>
                  </div>
                </button>

                <button
                  onClick={handleEmailClick}
                  className="w-full flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all group"
                >
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Mail className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-semibold text-gray-900">Email Us</p>
                    <p className="text-xs text-gray-600">{email}</p>
                  </div>
                </button>
              </div>

              {/* Footer */}
              <div className="px-4 pb-4">
                <p className="text-xs text-center text-gray-500">
                  Available Mon-Fri, 9 AM - 6 PM
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

