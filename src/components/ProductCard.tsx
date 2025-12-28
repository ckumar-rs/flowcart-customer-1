'use client';

import Link from 'next/link';
import SafeImage from './SafeImage';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { ShoppingCart, Plus, Minus, Sparkles, TrendingUp, Leaf, UtensilsCrossed } from 'lucide-react';
import { Product } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import WishlistButton from './WishlistButton';
import ProductImageSlider from './ProductImageSlider';
import { MotionDiv, scaleIn } from '@/utils/animations';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, updateQuantity, items } = useCartStore();
  const [imageLoaded, setImageLoaded] = useState(false);
  const cartItem = items.find(item => item.productId === product.productId);
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.isAvailable) {
      toast.error('Product is out of stock');
      return;
    }
    addItem(product, 1);
    toast.success(`${product.name} added to cart`, {
      icon: '🛒',
      style: {
        borderRadius: '12px',
        background: '#1D828E',
        color: '#fff',
      },
    });
  };

  const handleIncreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.isAvailable) {
      toast.error('Product is out of stock');
      return;
    }
    if (cartQuantity === 0) {
      addItem(product, 1);
      toast.success(`${product.name} added to cart`, {
        icon: '🛒',
      });
    } else {
      updateQuantity(product.productId, cartQuantity + 1);
    }
  };

  const handleDecreaseQuantity = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartQuantity > 1) {
      updateQuantity(product.productId, cartQuantity - 1);
    } else if (cartQuantity === 1) {
      updateQuantity(product.productId, 0);
      toast.success(`${product.name} removed from cart`);
    }
  };

  return (
    <MotionDiv
      className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-lg dark:shadow-2xl overflow-hidden hover:shadow-2xl dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 h-full flex flex-col border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300/50 dark:hover:border-primary-600/50"
      whileHover={{ y: -8, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      initial="initial"
      animate="animate"
      variants={scaleIn}
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.8) 100%)',
      }}
    >
      
      {/* Glassmorphic Wishlist Button */}
      <div className="absolute top-4 right-4 z-30 pointer-events-auto" data-no-link>
        <div className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-full p-1 shadow-lg border border-white/20 dark:border-gray-700/20">
          <WishlistButton product={product} size="sm" />
        </div>
      </div>

      {/* Floating Stock Badge with Animation */}
      {!product.isAvailable && (
        <MotionDiv
          className="absolute top-4 left-4 z-30 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full text-xs font-bold shadow-2xl backdrop-blur-sm border border-red-400/30"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        >
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            Out of Stock
          </span>
        </MotionDiv>
      )}

      {/* Veg/Non-Veg Badge */}
      {product.isVegetarian !== undefined && (
        <div className={`absolute top-4 left-4 z-20 backdrop-blur-md ${
          product.isVegetarian 
            ? 'bg-green-500/90 dark:bg-green-600/90 text-white' 
            : 'bg-red-500/90 dark:bg-red-600/90 text-white'
        } px-3 py-1.5 rounded-full text-xs font-bold shadow-lg border ${
          product.isVegetarian 
            ? 'border-green-400/30' 
            : 'border-red-400/30'
        } flex items-center gap-1.5`}>
          {product.isVegetarian ? (
            <>
              <Leaf className="w-3.5 h-3.5" />
              <span>VEG</span>
            </>
          ) : (
            <>
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>NON-VEG</span>
            </>
          )}
        </div>
      )}

      {/* Glassmorphic Category Badge */}
      {product.categoryName && !product.isAvailable && (
        <div className={`absolute ${product.isVegetarian !== undefined ? 'top-16' : 'top-4'} left-4 z-20 backdrop-blur-md bg-white/80 dark:bg-gray-800/80 text-primary-600 dark:text-primary-400 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-white/30 dark:border-gray-700/30`}>
          {product.categoryName}
        </div>
      )}
      {product.categoryName && product.isAvailable && product.isVegetarian === undefined && (
        <div className="absolute top-4 left-4 z-20 backdrop-blur-md bg-white/80 dark:bg-gray-800/80 text-primary-600 dark:text-primary-400 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-white/30 dark:border-gray-700/30">
          {product.categoryName}
        </div>
      )}
      {product.categoryName && product.isAvailable && product.isVegetarian !== undefined && (
        <div className="absolute top-16 left-4 z-20 backdrop-blur-md bg-white/80 dark:bg-gray-800/80 text-primary-600 dark:text-primary-400 px-3.5 py-1.5 rounded-full text-xs font-semibold shadow-lg border border-white/30 dark:border-gray-700/30">
          {product.categoryName}
        </div>
      )}

      {/* Product Image with Advanced Effects */}
      <Link 
        href={`/product/${product.productId}`}
        className="relative w-full h-72 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 cursor-pointer block overflow-hidden z-10 rounded-t-3xl"
      >
        {(() => {
          // Get all images (main image + additional images)
          const allImages: string[] = [];
          if (product.imageUrl) {
            allImages.push(product.imageUrl);
          }
          if (product.additionalImages && product.additionalImages.length > 0) {
            allImages.push(...product.additionalImages);
          }

          // If multiple images, use slider
          if (allImages.length > 1) {
            return (
              <ProductImageSlider
                images={allImages}
                alt={product.name}
                className="w-full h-full"
                showThumbnails={false}
                autoPlay={false}
              />
            );
          }

          // Single image or no image
          if (product.imageUrl) {
            return (
              <>
                {/* Blur placeholder */}
                {!imageLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
                )}
                <SafeImage
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className={`object-cover transition-all duration-700 group-hover:scale-125 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  onLoad={() => setImageLoaded(true)}
                  priority={false}
                />
                {/* Multi-layer gradient overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-transparent to-transparent opacity-0 group-hover:opacity-20 transition-opacity duration-500" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              </>
            );
          }

          return (
            <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
              <div className="text-center transform group-hover:scale-110 transition-transform duration-300">
                <div className="relative">
                  <ShoppingCart className="w-20 h-20 mx-auto mb-3 opacity-40" />
                  <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-2xl" />
                </div>
                <p className="text-xs opacity-50 font-medium">No Image</p>
              </div>
            </div>
          );
        })()}
      </Link>

      {/* Product Info with Enhanced Styling */}
      <div className="p-6 flex-1 flex flex-col bg-gradient-to-b from-transparent to-white/50 dark:to-gray-800/50 relative">
        <Link 
          href={`/product/${product.productId}`} 
          className="cursor-pointer mb-3 group/title"
        >
          <h3 className="font-extrabold text-gray-900 dark:text-white mb-2.5 line-clamp-2 text-xl group-hover/title:text-primary-600 dark:group-hover/title:text-primary-400 transition-all duration-300 leading-tight tracking-tight">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2 leading-relaxed group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
              {product.description}
            </p>
          )}
        </Link>

        {/* Price and Quantity Controls with Modern Design */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-5 border-t border-gray-200 dark:border-gray-700 min-w-0">
          {/* Enhanced Price Display */}
          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-baseline">
              {product.price !== undefined && product.price !== null ? (
                <span className="text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 leading-none truncate">
                  ₹{typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                </span>
              ) : (
                <span className="text-lg sm:text-xl font-semibold text-gray-400 dark:text-gray-500 leading-none">
                  Price not available
                </span>
              )}
            </div>
            {product.stockQuantity !== undefined && product.stockQuantity > 0 && (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse flex-shrink-0" />
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                  {product.stockQuantity} in stock
                </span>
              </div>
            )}
          </div>

          {/* Ultra-Modern Quantity Controls */}
          {cartQuantity > 0 ? (
            <div 
              className="flex items-center gap-1.5 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/40 dark:to-primary-800/30 border-2 border-primary-200/50 dark:border-primary-700/50 rounded-xl px-2 py-1.5 shadow-lg backdrop-blur-sm flex-shrink-0"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <button
                onClick={handleDecreaseQuantity}
                disabled={!product.isAvailable || cartQuantity === 0}
                className="p-1 hover:bg-primary-200/50 dark:hover:bg-primary-700/50 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 hover:scale-110 flex items-center justify-center w-7 h-7 flex-shrink-0"
                aria-label="Decrease quantity"
                type="button"
              >
                <Minus className="w-3.5 h-3.5 text-primary-700 dark:text-primary-300" />
              </button>
              <span className="w-7 text-center font-bold text-primary-700 dark:text-primary-300 text-sm min-w-[28px]">
                {cartQuantity}
              </span>
              <button
                onClick={handleIncreaseQuantity}
                disabled={!product.isAvailable}
                className="p-1 hover:bg-primary-200/50 dark:hover:bg-primary-700/50 rounded-lg transition-all duration-200 disabled:opacity-50 active:scale-90 hover:scale-110 flex items-center justify-center w-7 h-7 flex-shrink-0"
                aria-label="Increase quantity"
                type="button"
              >
                <Plus className="w-3.5 h-3.5 text-primary-700 dark:text-primary-300" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!product.isAvailable}
              className="px-4 py-2 bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-1.5 relative overflow-hidden group/btn flex-shrink-0"
              type="button"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm whitespace-nowrap">Add</span>
              {/* Button shine effect */}
              <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
            </button>
          )}
        </div>
      </div>

      {/* Advanced Shine Effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      
      {/* Glow effect on hover */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-400 rounded-3xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 -z-10" />
    </MotionDiv>
  );
}
