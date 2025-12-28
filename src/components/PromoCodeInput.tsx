'use client';

import { useState } from 'react';
import { Tag, X, CheckCircle, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { promotionService, Promotion } from '@/services/promotionService';

interface PromoCodeInputProps {
  businessId: string;
  orderAmount: number;
  onPromoApplied: (promotion: Promotion | null, discount: number) => void;
  customerId?: string;
}

export default function PromoCodeInput({
  businessId,
  orderAmount,
  onPromoApplied,
  customerId,
}: PromoCodeInputProps) {
  const [promoCode, setPromoCode] = useState('');
  const [validating, setValidating] = useState(false);
  const [appliedPromotion, setAppliedPromotion] = useState<Promotion | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      toast.error('Please enter a promo code');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      // First, get promotion by code
      const promotion = await promotionService.getByCode(businessId, promoCode.trim().toUpperCase());

      if (!promotion) {
        setError('Invalid promo code');
        toast.error('Invalid promo code');
        setAppliedPromotion(null);
        setDiscountAmount(0);
        onPromoApplied(null, 0);
        return;
      }

      // Validate promotion
      const validation = await promotionService.validate(
        promotion.promotionId,
        orderAmount,
        customerId
      );

      if (!validation.isValid) {
        setError(validation.errorMessage || 'Promo code is not valid for this order');
        toast.error(validation.errorMessage || 'Promo code is not valid for this order');
        setAppliedPromotion(null);
        setDiscountAmount(0);
        onPromoApplied(null, 0);
        return;
      }

      // Apply promotion
      setAppliedPromotion(promotion);
      setDiscountAmount(validation.discountAmount);
      onPromoApplied(promotion, validation.discountAmount);
      toast.success(`Promo code applied! You saved ₹${validation.discountAmount.toFixed(2)}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to validate promo code';
      setError(errorMessage);
      toast.error(errorMessage);
      setAppliedPromotion(null);
      setDiscountAmount(0);
      onPromoApplied(null, 0);
    } finally {
      setValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setAppliedPromotion(null);
    setDiscountAmount(0);
    setError(null);
    onPromoApplied(null, 0);
    toast.success('Promo code removed');
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Tag className="w-5 h-5 text-primary-600" />
        Promo Code
      </h3>

      {appliedPromotion ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-800">{appliedPromotion.promotionName}</p>
                <p className="text-sm text-green-600">
                  {appliedPromotion.discountType === 'PERCENTAGE'
                    ? `${appliedPromotion.discountValue}% off`
                    : appliedPromotion.discountType === 'FIXED_AMOUNT'
                    ? `₹${appliedPromotion.discountValue} off`
                    : 'Free shipping'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              className="p-1 text-green-600 hover:text-green-800 transition-colors"
              aria-label="Remove promo code"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-gray-600">
            Discount: <span className="font-semibold text-green-600">-₹{discountAmount.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => {
                setPromoCode(e.target.value.toUpperCase());
                setError(null);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleApplyPromo();
                }
              }}
              placeholder="Enter promo code"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent uppercase"
              disabled={validating}
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={validating || !promoCode.trim()}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {validating ? 'Applying...' : 'Apply'}
            </button>
          </div>
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

