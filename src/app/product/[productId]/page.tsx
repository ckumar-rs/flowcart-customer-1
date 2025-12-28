'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { ArrowLeft, ShoppingCart, Plus, Minus, Star, CheckCircle, XCircle, Package } from 'lucide-react';
import { Product, Feedback } from '@/types';
import { productService } from '@/services/productService';
import { reviewService } from '@/services/reviewService';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { sessionService } from '@/services/sessionService';
import WishlistButton from '@/components/WishlistButton';
import ShareProduct from '@/components/ShareProduct';
import ReviewCard from '@/components/ReviewCard';
import ReviewForm from '@/components/ReviewForm';
import ProductImageZoom from '@/components/ProductImageZoom';
import ProductImageSlider from '@/components/ProductImageSlider';
import ProductVideo from '@/components/ProductVideo';
import NutritionInfo from '@/components/NutritionInfo';
import RecentlyViewed from '@/components/RecentlyViewed';
import ProductRecommendations from '@/components/ProductRecommendations';
import { ProductDetailSkeleton } from '@/components/LoadingSkeleton';
import Link from 'next/link';
import { addToRecentlyViewed } from '@/utils/recentlyViewed';
import { motion } from 'framer-motion';
import { groupOrderService } from '@/services/groupOrderService';
import { GroupOrderDto } from '@/types';
import { Users } from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.productId as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [reviews, setReviews] = useState<Feedback[]>([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [activeGroupOrder, setActiveGroupOrder] = useState<GroupOrderDto | null>(null);
  const [addingToGroupOrder, setAddingToGroupOrder] = useState(false);
  const { user, isAuthenticated } = useAuthStore();

  const { addItem, updateQuantity, getItemQuantity, businessId } = useCartStore();
  const cartQuantity = product ? getItemQuantity(product.productId) : 0;


  useEffect(() => {
    if (productId) {
      loadProduct();
    }
    // Check for active group order in localStorage
    if (typeof window !== 'undefined' && businessId) {
      const activeGroupOrderStr = localStorage.getItem(`active_group_order_${businessId}`);
      if (activeGroupOrderStr) {
        try {
          const groupOrder = JSON.parse(activeGroupOrderStr);
          setActiveGroupOrder(groupOrder);
        } catch {
          localStorage.removeItem(`active_group_order_${businessId}`);
        }
      }
    }
  }, [productId, businessId]);

  useEffect(() => {
    if (product && cartQuantity > 0) {
      setQuantity(cartQuantity);
    }
  }, [product, cartQuantity]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      let actualBusinessId: string | null = businessId;
      if (!actualBusinessId && typeof window !== 'undefined') {
        actualBusinessId = sessionService.getCurrentBusinessId();
      }
      
      const [productData, reviewsData] = await Promise.all([
        productService.getById(productId, actualBusinessId || undefined),
        reviewService.getProductReviews(productId).catch(() => []),
      ]);
      setProduct(productData);
      setReviews(reviewsData);
      addToRecentlyViewed(productData);
    } catch (error: any) {
      console.error('Error loading product:', error);
      const { getErrorMessage } = await import('@/utils/errorMessages');
      const errorDetails = getErrorMessage(error);
      toast.error(errorDetails.message || 'Failed to load product. Please try again.');
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) {
      toast.error('Product not loaded');
      return;
    }

    if (!product.isAvailable) {
      toast.error('Product is out of stock');
      return;
    }

    // Get businessId from product or store
    let actualBusinessId = businessId;
    if (!actualBusinessId && typeof window !== 'undefined') {
        actualBusinessId = sessionService.getCurrentBusinessId() || product.businessId || null;
    }

    if (!actualBusinessId) {
      toast.error('Business information not available. Please select a business first.');
      return;
    }

    // Set business in cart store if not set
    if (businessId !== actualBusinessId) {
      const { setBusiness } = useCartStore.getState();
      setBusiness(actualBusinessId);
    }

    setAddingToCart(true);
    try {
      if (cartQuantity === 0) {
        addItem(product, quantity);
        toast.success(`${product.name} added to cart (${quantity})`, {
          icon: '🛒',
        });
      } else {
        updateQuantity(product.productId, quantity);
        toast.success(`Cart updated: ${quantity} ${product.name}`);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast.error('Failed to update cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity < 1) return;
    if (product?.stockQuantity && newQuantity > product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} units available`);
      return;
    }
    setQuantity(newQuantity);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ProductDetailSkeleton />
        </main>
      </div>
    );
  }

  if (!product && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md border border-gray-200/50 dark:border-gray-700/50"
        >
          <XCircle className="w-16 h-16 text-red-500 dark:text-red-400 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400 mb-4 text-lg font-bold">Product not found</p>
          <p className="text-gray-600 dark:text-gray-400 mb-6">The product you're looking for doesn't exist or has been removed.</p>
          {businessId ? (
            <Link 
              href={`/catalog/${businessId}`} 
              className="inline-block bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Back to Catalog
            </Link>
          ) : (
            <Link href="/" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
              Go back to Home
            </Link>
          )}
        </motion.div>
      </div>
    );
  }

  // Always render to maintain hook consistency
  if (!product) {
    return (
      <div className="min-h-screen bg-background dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">Product not found</p>
          <Link
            href={businessId ? `/catalog/${businessId}` : '/'}
            className="text-primary-600 dark:text-primary-400 hover:underline"
          >
            Go back to catalog
          </Link>
        </div>
      </div>
    );
  }

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      
      {/* Animated background gradient */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_30%,rgba(29,130,142,0.1),transparent_50%)]" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8"
        >
          {/* Product Image - Enhanced */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="relative w-full h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 rounded-xl sm:rounded-2xl overflow-hidden shadow-xl border border-gray-200/50 dark:border-gray-700/50 group"
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
                    showThumbnails={true}
                    autoPlay={false}
                  />
                );
              }

              // Single image
              if (product.imageUrl) {
                return (
                  <>
                    {!imageLoaded && (
                      <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
                    )}
                    <ProductImageZoom
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </>
                );
              }

              // No image
              return (
                <div className="w-full h-full flex items-center justify-center text-gray-300 dark:text-gray-500">
                  <div className="text-center">
                    <div className="relative">
                      <ShoppingCart className="w-32 h-32 mx-auto mb-3 opacity-40" />
                      <div className="absolute inset-0 bg-primary-500/10 rounded-full blur-3xl" />
                    </div>
                    <p className="text-sm opacity-50 font-medium">No Image</p>
                  </div>
                </div>
              );
            })()}
            
            {/* Floating badges */}
            {!product.isAvailable && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                className="absolute top-3 left-3 sm:top-6 sm:left-6 bg-gradient-to-r from-red-500 to-red-600 text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold shadow-2xl backdrop-blur-sm border border-red-400/30 z-10"
              >
                <span className="flex items-center gap-1.5 sm:gap-2">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" />
                  <span className="hidden sm:inline">Out of Stock</span>
                  <span className="sm:hidden">Out</span>
                </span>
              </motion.div>
            )}
            
            {product.categoryName && (
              <div className="absolute top-3 right-3 sm:top-6 sm:right-6 backdrop-blur-md bg-white/80 dark:bg-gray-800/80 text-primary-600 dark:text-primary-400 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold shadow-lg border border-white/30 dark:border-gray-700/30 z-10">
                <span className="truncate max-w-[120px] sm:max-w-none">{product.categoryName}</span>
              </div>
            )}
          </motion.div>

          {/* Product Info - Ultra Modern */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-4 sm:space-y-5 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            {/* Header with Title and Actions */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-gray-900 dark:text-white leading-tight tracking-tight flex-1">
                    {product.name}
                  </h1>
                  {/* Action Buttons - Mobile */}
                  <div className="flex items-center gap-2 flex-shrink-0 sm:hidden">
                    <div className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-full p-1.5 shadow-lg border border-white/20 dark:border-gray-700/20">
                      <ShareProduct
                        productName={product.name}
                        productId={product.productId}
                      />
                    </div>
                    <div className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-full p-1.5 shadow-lg border border-white/20 dark:border-gray-700/20">
                      <WishlistButton product={product} size="sm" />
                    </div>
                  </div>
                </div>
                {product.categoryName && (
                  <div className="inline-flex items-center gap-2 mb-3">
                    <div className="backdrop-blur-md bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-xs font-semibold border border-primary-200/50 dark:border-primary-700/50">
                      {product.categoryName}
                    </div>
                  </div>
                )}
                
                {/* Price with gradient */}
                <div className="mb-3 sm:mb-4">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 leading-none">
                    ₹{product.price.toFixed(2)}
                  </span>
                </div>
              </div>
              
              {/* Action Buttons - Desktop */}
              <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                <div className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-full p-1.5 shadow-lg border border-white/20 dark:border-gray-700/20">
                  <ShareProduct
                    productName={product.name}
                    productId={product.productId}
                  />
                </div>
                <div className="backdrop-blur-md bg-white/70 dark:bg-gray-800/70 rounded-full p-1.5 shadow-lg border border-white/20 dark:border-gray-700/20">
                  <WishlistButton product={product} size="lg" />
                </div>
              </div>
            </div>

            {/* Rating and Reviews */}
            {reviews.length > 0 && (
              <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-primary-50/50 to-primary-100/30 dark:from-primary-900/20 dark:to-primary-800/10 rounded-xl border border-primary-200/30 dark:border-primary-700/30">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-bold text-gray-900 dark:text-white">{averageRating.toFixed(1)}</span>
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">({reviews.length} {reviews.length === 1 ? 'review' : 'reviews'})</span>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Description</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm">{product.description}</p>
              </div>
            )}

            {/* Preparation Video */}
            {product.videoUrl && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">How to Prepare</h2>
                <ProductVideo videoUrl={product.videoUrl} productName={product.name} />
              </div>
            )}

            {/* Nutrition Information */}
            {product.nutritionInfo && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <NutritionInfo nutritionInfo={product.nutritionInfo} productName={product.name} />
              </div>
            )}

            {/* Stock Info - Enhanced */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              {product.isAvailable ? (
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-800">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-green-700 dark:text-green-400 font-bold text-sm">In Stock</p>
                    {product.stockQuantity !== undefined && (
                      <p className="text-xs text-green-600 dark:text-green-500 mt-0.5">
                        {product.stockQuantity} units available
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                  <p className="text-red-700 dark:text-red-400 font-bold text-sm">Out of Stock</p>
                </div>
              )}
            </div>

            {/* Quantity Selector - Modern */}
            {product.isAvailable && (
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-3">
                <label className="block font-bold text-gray-900 dark:text-white mb-2 text-sm">Quantity</label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex items-center justify-center sm:justify-start gap-2 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/40 dark:to-primary-800/30 border-2 border-primary-200/50 dark:border-primary-700/50 rounded-xl sm:rounded-2xl px-3 py-2 sm:py-2.5 shadow-lg backdrop-blur-sm w-full sm:w-auto">
                    <button
                      onClick={() => handleQuantityChange(quantity - 1)}
                      disabled={quantity <= 1}
                      className="p-2 hover:bg-primary-200/50 dark:hover:bg-primary-700/50 rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed active:scale-90 hover:scale-110 flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8"
                      aria-label="Decrease quantity"
                      type="button"
                    >
                      <Minus className="w-5 h-5 sm:w-4 sm:h-4 text-primary-700 dark:text-primary-300" />
                    </button>
                    <span className="w-16 sm:w-12 text-center font-black text-primary-700 dark:text-primary-300 text-xl sm:text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(quantity + 1)}
                      disabled={product.stockQuantity ? quantity >= product.stockQuantity : false}
                      className="p-2 hover:bg-primary-200/50 dark:hover:bg-primary-700/50 rounded-xl transition-all duration-200 disabled:opacity-50 active:scale-90 hover:scale-110 flex items-center justify-center w-10 h-10 sm:w-8 sm:h-8"
                      aria-label="Increase quantity"
                      type="button"
                    >
                      <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-primary-700 dark:text-primary-300" />
                    </button>
                  </div>
                  {cartQuantity > 0 && (
                    <div className="flex items-center justify-center sm:justify-start gap-2 text-sm text-primary-600 dark:text-primary-400 font-medium">
                      <Package className="w-4 h-4" />
                      <span>{cartQuantity} in cart</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Add to Cart Button - Ultra Modern */}
            {product.isAvailable && (
              <motion.button
                onClick={handleAddToCart}
                disabled={addingToCart}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white py-3 rounded-xl font-bold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl relative overflow-hidden group/btn"
                type="button"
              >
                <ShoppingCart className="w-4 h-4 flex-shrink-0" />
                <span className="relative z-10 text-sm">
                  {addingToCart 
                    ? 'Updating...' 
                    : cartQuantity > 0 
                      ? `Update Cart (${quantity})` 
                      : `Add to Cart (${quantity})`
                  }
                </span>
                {/* Button shine effect */}
                <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
              </motion.button>
            )}
          </motion.div>
        </motion.div>

        {/* Reviews Section - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-6 sm:mt-8 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 border border-gray-200/50 dark:border-gray-700/50"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-gray-900 dark:text-white">
                Reviews
              </h2>
              <div className="px-2 sm:px-2.5 py-0.5 sm:py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-xs font-bold">
                {reviews.length}
              </div>
            </div>
            <motion.button
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error('Please login to write a review');
                  router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                  return;
                }
                setShowReviewForm(!showReviewForm);
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-600 dark:to-primary-700 text-white px-4 py-2.5 sm:py-2 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-600 dark:hover:from-primary-700 dark:hover:to-primary-600 transition-all duration-300 shadow-lg hover:shadow-xl text-sm"
            >
              {showReviewForm ? 'Cancel' : 'Write Review'}
            </motion.button>
          </div>

          {/* Info Note for Customers */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 mb-4">
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">
                  <span className="font-semibold">Note:</span> To write a review, you must be logged in and have previously ordered this product. 
                  {!isAuthenticated && (
                    <span> Please <button onClick={() => router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)} className="font-semibold underline hover:no-underline">login</button> or <button onClick={() => router.push(`/register?redirect=${encodeURIComponent(window.location.pathname)}`)} className="font-semibold underline hover:no-underline">sign up</button> to continue.</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {showReviewForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white/50 dark:bg-gray-700/50 rounded-xl shadow-lg p-4 mb-4 border border-gray-200/50 dark:border-gray-600/50"
            >
              {isAuthenticated && user ? (
                <ReviewForm
                  productId={product.productId}
                  onSuccess={() => {
                    setShowReviewForm(false);
                    loadProduct();
                  }}
                  onCancel={() => setShowReviewForm(false)}
                />
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center">
                    <p className="text-sm text-blue-800 dark:text-blue-300 mb-4 font-medium">
                      You must be logged in to submit a review.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <button
                        onClick={() => {
                          router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`);
                        }}
                        className="bg-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-colors"
                      >
                        Login
                      </button>
                      <button
                        onClick={() => {
                          router.push(`/register?redirect=${encodeURIComponent(window.location.pathname)}`);
                        }}
                        className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Sign Up
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {reviews.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4 opacity-50" />
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No reviews yet</p>
              <p className="text-gray-400 dark:text-gray-500 text-sm">Be the first to review this product!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <ReviewCard key={review.feedbackId} review={review} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Product Recommendations - Always render to maintain hook consistency */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8"
        >
          {product && businessId ? (
            <ProductRecommendations
              businessId={businessId}
              currentProductId={product.productId}
              title="You May Also Like"
              limit={5}
            />
          ) : (
            <></>
          )}
        </motion.div>

        {/* Recently Viewed Products */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-8"
        >
          {businessId && <RecentlyViewed businessId={businessId} maxItems={5} />}
        </motion.div>
      </main>
    </div>
  );
}
