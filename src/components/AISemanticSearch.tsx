'use client';

import { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, X, Loader2 } from 'lucide-react';
import { Product } from '@/types';
import { aiService } from '@/services/aiService';
import ProductCard from './ProductCard';
import { motion, AnimatePresence } from 'framer-motion';

interface AISemanticSearchProps {
  businessId: string;
  onProductSelect?: (product: Product) => void;
}

export default function AISemanticSearch({ businessId, onProductSelect }: AISemanticSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async () => {
    if (!query.trim() || loading) return;

    setLoading(true);
    setError(null);
    setIsOpen(true);

    try {
      const products = await aiService.semanticSearch({
        query: query.trim(),
        businessId,
        limit: 10,
      });

      setResults(products);
    } catch (err: any) {
      console.error('Semantic search error:', err);
      setError('Failed to perform AI search. Please try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setError(null);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Ask AI: 'Show me spicy food under ₹200' or 'Find vegetarian options'..."
          className="w-full pl-11 pr-10 py-3 border-2 border-primary-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Search Button */}
      <button
        onClick={handleSearch}
        disabled={!query.trim() || loading}
        className="mt-2 w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-2.5 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>AI is searching...</span>
          </>
        ) : (
          <>
            <Search className="w-4 h-4" />
            <span>AI Semantic Search</span>
          </>
        )}
      </button>

      {/* Results */}
      <AnimatePresence>
        {isOpen && (results.length > 0 || error || loading) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto"
          >
            {loading && (
              <div className="p-6 text-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  AI is understanding your query...
                </p>
              </div>
            )}

            {error && (
              <div className="p-4 text-center">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {!loading && !error && results.length > 0 && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Found {results.length} products
                    </p>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {results.map((product) => (
                    <div
                      key={product.productId}
                      onClick={() => {
                        onProductSelect?.(product);
                        setIsOpen(false);
                      }}
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-16 h-16 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {product.name}
                          </h4>
                          <p className="text-primary-600 dark:text-primary-400 font-bold text-sm">
                            ₹{product.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && !error && results.length === 0 && query && (
              <div className="p-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No products found. Try rephrasing your query.
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

