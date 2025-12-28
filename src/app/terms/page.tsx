'use client';

import Link from 'next/link';

export default function TermsConditionsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms & Conditions</h1>
          
          <div className="prose prose-gray max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p className="text-gray-700 leading-relaxed">
                By accessing and using FlowCart, you accept and agree to be bound by the terms and provision of this agreement. 
                If you do not agree to these terms, please do not use our service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">2. Use of Service</h2>
              <p className="text-gray-700 leading-relaxed mb-3">You agree to use FlowCart only for lawful purposes and in accordance with these Terms. You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>Use the service in any way that violates any applicable law or regulation</li>
                <li>Attempt to gain unauthorized access to any portion of the service</li>
                <li>Interfere with or disrupt the service or servers connected to the service</li>
                <li>Use any automated system to access the service without permission</li>
                <li>Impersonate any person or entity or misrepresent your affiliation with any person or entity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
              <p className="text-gray-700 leading-relaxed">
                You may be required to create an account to access certain features. You are responsible for maintaining the 
                confidentiality of your account credentials and for all activities that occur under your account. You agree to 
                notify us immediately of any unauthorized use of your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">4. Orders and Payments</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                When you place an order through FlowCart:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-gray-700">
                <li>You agree to provide accurate and complete information</li>
                <li>You authorize us to charge your payment method for the total amount of your order</li>
                <li>All prices are subject to change without notice</li>
                <li>We reserve the right to refuse or cancel any order at our discretion</li>
                <li>Orders are subject to availability and acceptance by the restaurant</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">5. Cancellation and Refunds</h2>
              <p className="text-gray-700 leading-relaxed">
                You may cancel an order before it is confirmed by the restaurant. Once an order is confirmed, cancellation 
                policies vary by restaurant. Refunds, if applicable, will be processed according to the restaurant's policy 
                and may take 5-10 business days to appear in your account.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
              <p className="text-gray-700 leading-relaxed">
                All content, features, and functionality of FlowCart, including but not limited to text, graphics, logos, images, 
                and software, are the property of FlowCart or its licensors and are protected by copyright, trademark, and other 
                intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">7. Limitation of Liability</h2>
              <p className="text-gray-700 leading-relaxed">
                FlowCart acts as an intermediary between you and restaurants. We are not responsible for the quality, safety, or 
                delivery of food items. To the maximum extent permitted by law, FlowCart shall not be liable for any indirect, 
                incidental, special, consequential, or punitive damages arising out of your use of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">8. Indemnification</h2>
              <p className="text-gray-700 leading-relaxed">
                You agree to indemnify and hold harmless FlowCart, its officers, directors, employees, and agents from any claims, 
                damages, losses, liabilities, and expenses arising out of your use of the service or violation of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">9. Modifications to Service</h2>
              <p className="text-gray-700 leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part of the service at any time, with or without notice. 
                We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">10. Governing Law</h2>
              <p className="text-gray-700 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which FlowCart operates, 
                without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3">11. Contact Information</h2>
              <p className="text-gray-700 leading-relaxed">
                If you have any questions about these Terms & Conditions, please contact us at:
              </p>
              <p className="text-gray-700 leading-relaxed mt-2">
                <strong>Email:</strong> legal@flowcart.com<br />
                <strong>Phone:</strong> +1 (555) 123-4567
              </p>
            </section>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-500">Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

