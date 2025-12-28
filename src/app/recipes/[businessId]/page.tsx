'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Search, Filter, Video, Clock, TrendingUp, Sparkles } from 'lucide-react';
import { Business, Product, Category } from '@/types';
import { businessService } from '@/services/businessService';
import { recipeService } from '@/services/recipeService';
import { useCartStore } from '@/stores/cartStore';
import RecipeCard from '@/components/RecipeCard';
import Pagination from '@/components/Pagination';
import { CatalogSkeleton } from '@/components/LoadingSkeleton';
import VegNonVegFilter, { VegFilterOption } from '@/components/VegNonVegFilter';
import ProductSort, { SortOption } from '@/components/ProductSort';

export default function RecipesPage() {
  const params = useParams();
  const router = useRouter();
  const businessId = params.businessId as string;
  
  const [business, setBusiness] = useState<Business | null>(null);
  const [recipes, setRecipes] = useState<Product[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [vegFilter, setVegFilter] = useState<VegFilterOption>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const { setBusiness: setCartBusiness } = useCartStore();

  const loadData = async (page: number = currentPage) => {
    try {
      setLoading(true);
      
      // Load business data (only once)
      if (!business) {
        const businessData = await businessService.getById(businessId);
        setBusiness(businessData);
        setCartBusiness(businessId);
      }

      // Load recipes with pagination
      const categoryId = selectedCategory !== 'all' ? selectedCategory : undefined;
      const searchTerm = searchQuery.trim() || undefined;
      
      let result;
      if (searchTerm) {
        result = await recipeService.search(businessId, searchTerm, page, pageSize);
      } else {
        result = await recipeService.getByBusiness(
          businessId, 
          page, 
          pageSize, 
          categoryId, 
          searchTerm
        );
      }

      setRecipes(result.products);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);

      // Load categories (only once) - extract from loaded recipes
      if (categories.length === 0 && result.products.length > 0) {
        try {
          // Extract unique categories from loaded recipes
          const uniqueCategories = Array.from(
            new Map(
              result.products
                .filter(p => p.categoryId && p.categoryName)
                .map(p => [p.categoryId, { categoryId: p.categoryId!, name: p.categoryName! }])
            ).values()
          );
          setCategories(uniqueCategories as any);
        } catch (error) {
          console.error('Failed to extract categories:', error);
        }
      }
      
    } catch (error: any) {
      console.error('Failed to load recipes:', error);
      toast.error(error.response?.data?.message || 'Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (businessId) {
      loadData();
    }
  }, [businessId]);

  useEffect(() => {
    // Apply filters and sorting
    let filtered = [...recipes];

    // Veg/Non-Veg filter
    if (vegFilter !== 'all') {
      filtered = filtered.filter(recipe => {
        if (vegFilter === 'veg') return recipe.isVegetarian === true;
        if (vegFilter === 'non-veg') return recipe.isVegetarian === false;
        return true;
      });
    }

    // Sort
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
      // @ts-expect-error: 'preparation-time' might not be in SortOption enum
      case 'preparation-time':
        filtered.sort((a, b) => (a.preparationTime ?? 0) - (b.preparationTime ?? 0));
        break;
      default:
        // Default: featured first, then by name
        filtered.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return a.name.localeCompare(b.name);
        });
    }

    setFilteredRecipes(filtered);
  }, [recipes, vegFilter, sortOption]);

  useEffect(() => {
    // Reload when filters change
    if (businessId) {
      setCurrentPage(1);
      loadData(1);
    }
  }, [selectedCategory, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadData(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData(1);
  };

  if (loading && recipes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <CatalogSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-500 dark:from-primary-400 dark:to-primary-300 mb-2">
                Recipe Collection
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Browse tons of video recipes and recipe links from {business?.name || 'our collection'}
              </p>
            </div>
            <Link
              href={`/catalog/${businessId}`}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
            >
              View Products
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-xl">
                  <Video className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalCount}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Recipes Available</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recipes.filter(r => r.isFeatured).length}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Featured Recipes</p>
                </div>
              </div>
            </div>
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                  <Clock className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {Math.round(recipes.reduce((sum, r) => sum + (r.preparationTime || 0), 0) / recipes.length) || 0}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Prep Time (min)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-lg border border-gray-200/50 dark:border-gray-700/50 mb-6">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search recipes..."
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white transition-all"
                />
              </div>
            </form>

            {/* Filter Toggle (Mobile) */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-xl font-semibold"
              >
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>

            {/* Filters */}
            <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showFilters ? 'block' : 'hidden lg:grid'}`}>
              <VegNonVegFilter value={vegFilter} onChange={setVegFilter} />
              <ProductSort value={sortOption} onChange={setSortOption} />
            </div>
          </div>
        </div>

        {/* Recipes Grid */}
        {filteredRecipes.length === 0 ? (
          <div className="text-center py-16">
            <Video className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              No Recipes Found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery 
                ? `No recipes match "${searchQuery}"`
                : 'No recipes available at the moment'}
            </p>
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setCurrentPage(1);
                  loadData(1);
                }}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {filteredRecipes.map((recipe) => (
                <RecipeCard key={recipe.productId} recipe={recipe} businessId={businessId} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange} pageSize={0} totalCount={0}              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

