'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Camera, Sparkles, Mic, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { Business, Product, Category } from '@/types';
import { businessService } from '@/services/businessService';
import { productService } from '@/services/productService';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { sessionService } from '@/services/sessionService';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import SearchAutocomplete from '@/components/SearchAutocomplete';
import AISemanticSearch from '@/components/AISemanticSearch';
import AIImageSearch from '@/components/AIImageSearch';
import AIVoiceSearch from '@/components/AIVoiceSearch';
import ProductSort, { SortOption } from '@/components/ProductSort';
import Pagination from '@/components/Pagination';
import { CatalogSkeleton } from '@/components/LoadingSkeleton';
import VegNonVegFilter, { VegFilterOption } from '@/components/VegNonVegFilter';

export default function CatalogPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [vegFilter, setVegFilter] = useState<VegFilterOption>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20); // Fixed page size
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [showAISearch, setShowAISearch] = useState(false);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showAISearchPanel, setShowAISearchPanel] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      // On desktop, always show filters
      if (window.innerWidth >= 1024) {
        setShowFilters(true);
        setShowAISearchPanel(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { setBusiness: setCartBusiness, items: cartItems } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();

  const loadData = async (page: number = currentPage) => {
    try {
      setLoading(true);
      
      // Load business data (only once)
      if (!business) {
        const businessData = await businessService.getById(businessId);
        setBusiness(businessData);
      }

      // Load products with pagination and server-side filtering
      const categoryId = selectedCategory !== 'all' ? selectedCategory : undefined;
      const searchTerm = searchQuery.trim() || undefined;
      const result = await productService.getByBusiness(
        businessId, 
        page, 
        pageSize, 
        categoryId, 
        searchTerm
      );

      setProducts(result.products);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
      
      // Extract unique categories from all products (we might need to load all categories separately)
      // For now, extract from loaded products
      if (result.products.length > 0) {
        const uniqueCategories = Array.from(
          new Map(
            result.products
              .filter(p => p.categoryId && p.categoryName)
              .map(p => [
                p.categoryId, 
                { 
                  categoryId: p.categoryId!, 
                  businessId: businessId,
                  name: p.categoryName!,
                  isActive: true
                }
              ])
          ).values()
        ) as Category[];
        // Merge with existing categories to avoid losing categories from other pages
        setCategories(prev => {
          const combined = [...prev, ...uniqueCategories];
          return Array.from(
            new Map(combined.map(cat => [cat.categoryId, cat])).values()
          ) as Category[];
        });
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      const { getErrorMessage } = await import('@/utils/errorMessages');
      const errorDetails = getErrorMessage(error);
      toast.error(errorDetails.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      setCurrentPage(1); // Reset to first page when business changes
      
      // Update/create session using session service
      const existingSession = sessionService.getSession();
      if (!existingSession || existingSession.businessId !== businessId) {
        // Create new session or update if business changed
        sessionService.createSession(businessId);
      } else {
        // Extend existing session
        sessionService.extendSession();
      }
      
      // Set business in cart store (this also clears cart if switching businesses)
      setCartBusiness(businessId);
      
      // Load data
      loadData(1);
    }
    // Zustand persist automatically loads wishlist from localStorage
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  useEffect(() => {
    // When filters/search change, reset to page 1 and reload
    if (businessId) {
      setCurrentPage(1);
      loadData(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchQuery, vegFilter]);

  useEffect(() => {
    // When page changes, reload data
    if (businessId) {
      loadData(currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  useEffect(() => {
    // Client-side filtering and sorting on current page results
    filterAndSortProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products, sortOption, vegFilter]);

  // CRITICAL: All hooks must be called BEFORE any early returns
  // Dispatch cart open event for AppHeader to listen to
  useEffect(() => {
    const handleOpenCart = () => setCartOpen(true);
    window.addEventListener('openCart', handleOpenCart);
    return () => window.removeEventListener('openCart', handleOpenCart);
  }, []);

  const filterAndSortProducts = () => {
    // Products are already filtered by backend (categoryId and searchTerm)
    // We need to filter by veg/non-veg and sort them client-side
    let filtered = [...products];

    // Filter by veg/non-veg
    if (vegFilter !== 'all') {
      filtered = filtered.filter(product => {
        if (vegFilter === 'veg') {
          return product.isVegetarian === true;
        } else if (vegFilter === 'non-veg') {
          return product.isVegetarian === false;
        }
        return true;
      });
    }

    // Sort products (client-side, backend doesn't support sorting yet)
    switch (sortOption) {
      case 'name-asc':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'default':
      default:
        // Keep original order
        break;
    }

    setFilteredProducts(filtered);
  };

  // Calculate counts directly from items (avoid function calls that might not be available during SSR)
  const cartItemCount = cartItems?.length || 0;
  const wishlistCount = wishlistItems?.length || 0;

  // Early returns AFTER all hooks have been called
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CatalogSkeleton />
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Business not found</p>
          <Link href="/" className="text-primary-600 hover:underline">
            Go back
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search and Filters Section - Mobile Responsive */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[56px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          {/* Search Bar and Sort - Always Visible */}
          <div className="mb-4">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex-1 w-full sm:w-auto">
                <SearchAutocomplete
                  products={products}
                  onSearch={setSearchQuery}
                  placeholder="Search products..."
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <ProductSort value={sortOption} onChange={setSortOption} />
                {/* Mobile Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                  {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Collapsible Filters Section - Mobile Responsive */}
          <div className={`space-y-4 transition-all duration-300 overflow-hidden relative ${
            showFilters || !isMobile ? 'block' : 'hidden'
          }`}>
            {/* Close Filters Button - Mobile Only */}
            {isMobile && showFilters && (
              <button
                onClick={() => setShowFilters(false)}
                className="absolute top-0 right-0 p-2 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors z-10"
                aria-label="Close filters"
              >
                <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </button>
            )}

            {/* AI Search Options */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">AI Search</h3>
                {/* Toggle button for mobile */}
                <button
                  onClick={() => setShowAISearchPanel(!showAISearchPanel)}
                  className="lg:hidden p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                  aria-label={showAISearchPanel ? 'Collapse AI Search' : 'Expand AI Search'}
                >
                  {showAISearchPanel ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>
              
              <div className={`transition-all duration-300 overflow-hidden ${
                showAISearchPanel || !isMobile ? 'block' : 'hidden'
              }`}>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      setShowAISearch(!showAISearch);
                      setShowImageSearch(false);
                      setShowVoiceSearch(false);
                    }}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      showAISearch
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Semantic Search</span>
                    <span className="sm:hidden">Semantic</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowImageSearch(!showImageSearch);
                      setShowAISearch(false);
                      setShowVoiceSearch(false);
                    }}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      showImageSearch
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Image Search</span>
                    <span className="sm:hidden">Image</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowVoiceSearch(!showVoiceSearch);
                      setShowAISearch(false);
                      setShowImageSearch(false);
                    }}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                      showVoiceSearch
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/30'
                    }`}
                  >
                    <Mic className="w-4 h-4" />
                    <span className="hidden sm:inline">AI Voice Search</span>
                    <span className="sm:hidden">Voice</span>
                  </button>
                </div>

                {/* AI Search Components with Close Button */}
                {showAISearch && (
                  <div className="mt-4 relative bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowAISearch(false)}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Close AI Semantic Search"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <AISemanticSearch
                      businessId={businessId}
                      onProductSelect={(product) => {
                        router.push(`/product/${product.productId}`);
                        setShowAISearch(false);
                      }}
                    />
                  </div>
                )}

                {showImageSearch && (
                  <div className="mt-4 relative bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowImageSearch(false)}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Close AI Image Search"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <AIImageSearch
                      businessId={businessId}
                      onProductSelect={(product) => {
                        router.push(`/product/${product.productId}`);
                        setShowImageSearch(false);
                      }}
                    />
                  </div>
                )}

                {showVoiceSearch && (
                  <div className="mt-4 relative bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => setShowVoiceSearch(false)}
                      className="absolute top-2 right-2 z-10 p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="Close AI Voice Search"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </button>
                    <AIVoiceSearch
                      businessId={businessId}
                      onProductSelect={(product) => {
                        router.push(`/product/${product.productId}`);
                        setShowVoiceSearch(false);
                      }}
                      onClose={() => setShowVoiceSearch(false)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Veg/Non-Veg Filter */}
            <div>
              <VegNonVegFilter value={vegFilter} onChange={setVegFilter} />
            </div>

            {/* Category Filters */}
            {categories.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Categories</h3>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                      selectedCategory === 'all'
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.categoryId}
                      onClick={() => setSelectedCategory(category.categoryId)}
                      className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                        selectedCategory === category.categoryId
                          ? 'bg-primary-600 text-white shadow-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative">
        {/* Animated background gradient */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary-50/30 via-transparent to-primary-100/20 dark:from-primary-900/10 dark:via-transparent dark:to-primary-800/10" />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(29,130,142,0.1),transparent_50%)]" />
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <p className="text-gray-500 dark:text-gray-400 text-lg font-medium mb-2">No products found</p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No products available at this time'}
            </p>
          </div>
        ) : (
          <>
            {/* Results Count - Enhanced */}
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-1 w-1 rounded-full bg-primary-500 animate-pulse" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing <span className="font-bold text-gray-900 dark:text-white">{filteredProducts.length}</span> of{' '}
                  <span className="font-bold text-gray-900 dark:text-white">{totalCount}</span> products
                  {totalPages > 1 && (
                    <span className="ml-2 text-primary-600 dark:text-primary-400">(Page {currentPage} of {totalPages})</span>
                  )}
                </p>
              </div>
            </div>

                {/* Products Grid - Enhanced spacing and layout */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.productId} product={product} />
                  ))}
                </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                totalCount={totalCount}
              />
            )}
          </>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}

