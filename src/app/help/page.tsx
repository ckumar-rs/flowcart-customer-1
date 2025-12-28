'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, ShoppingBag, CreditCard, Package, User, MessageCircle, Mail, Phone } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I place an order?',
    answer: 'Browse the catalog, add items to your cart, and proceed to checkout. You can order as a guest or create an account for faster checkout and order tracking.'
  },
  {
    question: 'What payment methods are accepted?',
    answer: 'We accept Cash on Delivery (COD), credit/debit cards, Razorpay, Stripe, and other digital payment methods. Payment options may vary by restaurant.'
  },
  {
    question: 'Can I cancel my order?',
    answer: 'You can cancel orders that are still pending. Once an order is confirmed by the restaurant, cancellation policies may vary. Check your order details for cancellation options.'
  },
  {
    question: 'How do I track my order?',
    answer: 'After placing an order, you can view its status in the "My Orders" section. You\'ll receive real-time updates on your order status.'
  },
  {
    question: 'Do I need to create an account?',
    answer: 'No, you can order as a guest. However, creating an account allows you to track orders, save addresses, and access exclusive offers.'
  },
  {
    question: 'How do I add items to my wishlist?',
    answer: 'Click the heart icon on any product to add it to your wishlist. You can view all wishlisted items in the "Wishlist" section.'
  },
  {
    question: 'What if I have dietary restrictions?',
    answer: 'Please check product descriptions for ingredient information. You can also add special instructions when placing your order.'
  },
  {
    question: 'How do I contact customer support?',
    answer: 'You can reach us via email at support@flowcart.com or call us at +1 (555) 123-4567. We\'re available Monday-Friday, 9 AM - 6 PM.'
  }
];

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Help Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <ShoppingBag className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Ordering</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Learn how to place orders, manage your cart, and track deliveries.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <CreditCard className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Payments</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Information about payment methods, refunds, and billing.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <Package className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Orders</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Track orders, view order history, and manage cancellations.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <User className="w-6 h-6 text-primary-600" />
              <h3 className="text-lg font-semibold text-gray-900">Account</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Manage your account, update profile, and change password.
            </p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <HelpCircle className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-4 pb-4 text-gray-700 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact Section */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="flex items-center gap-3 mb-6">
            <MessageCircle className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-bold text-gray-900">Contact Support</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="bg-primary-100 rounded-full p-3">
                <Mail className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Email Us</h3>
                <a href="mailto:support@flowcart.com" className="text-primary-600 hover:underline">
                  support@flowcart.com
                </a>
                <p className="text-sm text-gray-600 mt-1">We typically respond within 24 hours</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-primary-100 rounded-full p-3">
                <Phone className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Call Us</h3>
                <a href="tel:+15551234567" className="text-primary-600 hover:underline">
                  +1 (555) 123-4567
                </a>
                <p className="text-sm text-gray-600 mt-1">Mon-Fri, 9 AM - 6 PM</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

