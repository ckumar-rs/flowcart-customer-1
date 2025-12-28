'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Heart, Mail, Phone, HelpCircle, FileText, Shield } from 'lucide-react';

export default function Footer() {
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();

  // Hide footer on login, register, forgot-password, and reset-password pages
  // Use state to handle visibility after mount to avoid hook order issues
  const [shouldShow, setShouldShow] = useState(true);

  useEffect(() => {
    const hideOnPages = ['/login', '/register', '/forgot-password', '/reset-password'];
    setShouldShow(!hideOnPages.includes(pathname || ''));
  }, [pathname]);

  // Always render to maintain hook consistency, but conditionally hide
  return (
    <footer className={`bg-gray-900 text-gray-300 mt-auto ${!shouldShow ? 'hidden' : ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">FlowCart</h3>
            <p className="text-sm leading-relaxed">
              Your one-stop solution for ordering from your favorite restaurants. 
              Fast, convenient, and reliable food delivery service.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/orders" className="hover:text-white transition-colors">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-white transition-colors">
                  Wishlist
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-white transition-colors">
                  My Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/help" className="flex items-center gap-2 hover:text-white transition-colors">
                  <HelpCircle className="w-4 h-4" />
                  Help Center
                </Link>
              </li>
              <li>
                <a href="mailto:support@flowcart.com" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Mail className="w-4 h-4" />
                  Contact Us
                </a>
              </li>
              <li>
                <a href="tel:+15551234567" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Phone className="w-4 h-4" />
                  +1 (555) 123-4567
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/privacy" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="flex items-center gap-2 hover:text-white transition-colors">
                  <FileText className="w-4 h-4" />
                  Terms & Conditions
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-400">
              © {currentYear} FlowCart. All rights reserved.
            </p>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500 fill-current" />
              <span>for food lovers</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

