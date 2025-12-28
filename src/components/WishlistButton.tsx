'use client';

import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '@/types';
import { useWishlistStore } from '@/stores/wishlistStore';

interface WishlistButtonProps {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
}

export default function WishlistButton({ product, size = 'md' }: WishlistButtonProps) {
  const { addItem, removeItem, isInWishlist } = useWishlistStore();

  // Zustand persist automatically loads from localStorage, no need to call loadWishlist
  const inWishlist = isInWishlist(product.productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (inWishlist) {
      removeItem(product.productId);
      toast.success('Removed from wishlist');
    } else {
      addItem(product);
      toast.success('Added to wishlist');
    }
  };

  const sizeClasses = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <button
      onClick={handleClick}
      className={`p-2 rounded-full transition-colors ${
        inWishlist
          ? 'bg-red-100 text-red-600 hover:bg-red-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
      aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Heart
        className={`${sizeClasses[size]} ${inWishlist ? 'fill-current' : ''}`}
      />
    </button>
  );
}

