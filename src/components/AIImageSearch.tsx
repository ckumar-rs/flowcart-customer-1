'use client';

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, Loader2, Sparkles, Search } from 'lucide-react';
import { Product } from '@/types';
import { aiService } from '@/services/aiService';
import ProductCard from './ProductCard';
import { motion, AnimatePresence } from 'framer-motion';

interface AIImageSearchProps {
  businessId: string;
  onProductSelect?: (product: Product) => void;
}

export default function AIImageSearch({ businessId, onProductSelect }: AIImageSearchProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate image type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setSelectedImage(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSearch = async () => {
    if (!selectedImage || loading) return;

    setLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      const products = await aiService.imageSearch({
        imageFile: selectedImage,
        businessId,
        limit: 10,
      });

      setResults(products);
    } catch (err: any) {
      console.error('Image search error:', err);
      setError('Failed to search by image. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setPreview(null);
    setResults([]);
    setError(null);
    setIsOpen(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full">
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-xl p-6 border-2 border-dashed border-primary-300 dark:border-primary-700">
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900/50 rounded-full mb-3">
            <Sparkles className="w-8 h-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            AI Image Search
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload a product image to find similar items
          </p>
        </div>

        {!preview ? (
          <div className="flex flex-col items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-primary-300 dark:border-primary-700 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/30 transition-colors font-semibold text-primary-700 dark:text-primary-400"
            >
              <Upload className="w-5 h-5" />
              Choose Image
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              PNG, JPG, or WEBP (max 5MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative inline-block mx-auto">
              <img
                src={preview}
                alt="Preview"
                className="max-w-full max-h-64 rounded-lg shadow-md"
              />
              <button
                onClick={clearImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>AI is analyzing image...</span>
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Find Similar Products</span>
                </>
              )}
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {isOpen && (results.length > 0 || error) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-600" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Similar Products
                </h3>
              </div>
              {results.length > 0 && (
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  Found {results.length} products
                </span>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {results.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {results.map((product) => (
                  <div
                    key={product.productId}
                    onClick={() => onProductSelect?.(product)}
                    className="cursor-pointer"
                  >
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

