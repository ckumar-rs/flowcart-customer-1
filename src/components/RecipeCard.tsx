'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Play, Clock, UtensilsCrossed, Leaf, TrendingUp, ExternalLink, Globe, Eye, Heart, Star, Users, ChefHat, Globe2, BookOpen } from 'lucide-react';
import { Product } from '@/types';
import SafeImage from './SafeImage';
import { motion } from 'framer-motion';

interface RecipeCardProps {
  recipe: Product;
  businessId: string;
}

export default function RecipeCard({ recipe, businessId }: RecipeCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Extract YouTube video ID if it's a YouTube URL
  const getYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const hasVideo = recipe.videoUrl && recipe.videoUrl.trim() !== '';
  const hasRecipeUrl = recipe.recipeUrl && recipe.recipeUrl.trim() !== '';
  const isYouTube = recipe.videoUrl?.includes('youtube.com') || recipe.videoUrl?.includes('youtu.be');
  const youtubeId = recipe.videoUrl && isYouTube ? getYouTubeId(recipe.videoUrl) : null;
  const thumbnailUrl = youtubeId 
    ? `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`
    : recipe.imageUrl;

  return (
    <motion.div
      className="group relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-lg dark:shadow-2xl overflow-hidden hover:shadow-2xl dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-500 h-full flex flex-col border border-gray-200/50 dark:border-gray-700/50 hover:border-primary-300/50 dark:hover:border-primary-600/50"
      whileHover={{ y: -8, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col h-full">
        {/* Main Link - Product Page */}
        <Link href={`/product/${recipe.productId}?businessId=${businessId}`} className="flex flex-col flex-1">
        {/* Video Thumbnail Section */}
        <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-900 dark:to-gray-800">
          {thumbnailUrl ? (
            <>
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30 z-0">
                  <UtensilsCrossed className="w-16 h-16 text-primary-600 dark:text-primary-400 opacity-50 animate-pulse" />
                </div>
              )}
              <div className="relative w-full h-full">
                <SafeImage
                  src={thumbnailUrl}
                  alt={recipe.name}
                  fill
                  className={`transition-transform duration-700 group-hover:scale-110 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                  onLoad={() => setImageLoaded(true)}
                  objectFit="cover"
                />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
              <UtensilsCrossed className="w-16 h-16 text-primary-600 dark:text-primary-400 opacity-50" />
            </div>
          )}

          {/* Play/Webpage Button Overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition-colors">
            <motion.div
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              className="w-20 h-20 bg-white/95 dark:bg-gray-800/95 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm border-4 border-primary-500/50"
            >
              {hasVideo ? (
                <Play className="w-10 h-10 text-primary-600 dark:text-primary-400 ml-1" fill="currentColor" />
              ) : hasRecipeUrl ? (
                <Globe className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              ) : (
                <UtensilsCrossed className="w-10 h-10 text-primary-600 dark:text-primary-400" />
              )}
            </motion.div>
          </div>

          {/* Badge - Video or Webpage */}
          <div className="absolute top-3 right-3">
            {hasVideo ? (
              <div className="bg-primary-600 dark:bg-primary-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                <Play className="w-3 h-3" fill="currentColor" />
                <span>Recipe Video</span>
              </div>
            ) : hasRecipeUrl ? (
              <div className="bg-green-600 dark:bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                <ExternalLink className="w-3 h-3" />
                <span>Recipe Link</span>
              </div>
            ) : null}
          </div>

          {/* Time Badge - Show Total Time or Prep Time */}
          {(recipe.totalTimeInMins || recipe.prepTimeInMins || recipe.preparationTime) && (
            <div className="absolute top-3 left-3">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-900 dark:text-white px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 shadow-lg">
                <Clock className="w-3.5 h-3.5 text-primary-600 dark:text-primary-400" />
                <span>
                  {recipe.totalTimeInMins 
                    ? `${recipe.totalTimeInMins} min total`
                    : recipe.prepTimeInMins 
                    ? `${recipe.prepTimeInMins} min prep`
                    : `${recipe.preparationTime} min`}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-4 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {recipe.recipeName || recipe.translatedRecipeName || recipe.name}
          </h3>
          
          {/* Translated Name (if different) */}
          {recipe.translatedRecipeName && recipe.translatedRecipeName !== recipe.recipeName && (
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-2 italic line-clamp-1">
              {recipe.translatedRecipeName}
            </p>
          )}

          {/* Description */}
          {recipe.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 flex-1">
              {recipe.description}
            </p>
          )}

          {/* Recipe Data Points Row - Based on Sample Data */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Prep Time */}
            {(recipe.prepTimeInMins || recipe.preparationTime) && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">
                  {recipe.prepTimeInMins || recipe.preparationTime} min prep
                </span>
              </div>
            )}

            {/* Cook Time */}
            {recipe.cookTimeInMins && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{recipe.cookTimeInMins} min cook</span>
              </div>
            )}

            {/* Total Time */}
            {recipe.totalTimeInMins && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{recipe.totalTimeInMins} min total</span>
              </div>
            )}

            {/* Servings */}
            {recipe.servings && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400">
                <Users className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{recipe.servings} servings</span>
              </div>
            )}

            {/* Cuisine */}
            {recipe.cuisine && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                <Globe2 className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold truncate">{recipe.cuisine}</span>
              </div>
            )}

            {/* Course */}
            {recipe.course && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400">
                <BookOpen className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold truncate">{recipe.course}</span>
              </div>
            )}

            {/* Diet */}
            {recipe.diet && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 col-span-2">
                <Leaf className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold truncate">{recipe.diet}</span>
              </div>
            )}

            {/* Views (if available) */}
            {recipe.views !== undefined && recipe.views > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                <Eye className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{recipe.views.toLocaleString()}</span>
              </div>
            )}

            {/* Likes (if available) */}
            {recipe.likes !== undefined && recipe.likes > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-400">
                <Heart className="w-3.5 h-3.5" fill="currentColor" />
                <span className="text-xs font-semibold">{recipe.likes.toLocaleString()}</span>
              </div>
            )}

            {/* Rating (if available) */}
            {recipe.rating !== undefined && recipe.rating > 0 && (
              <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400">
                <Star className="w-3.5 h-3.5" fill="currentColor" />
                <span className="text-xs font-semibold">{recipe.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap mt-auto">
            {recipe.isVegetarian !== undefined && (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                recipe.isVegetarian
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
              }`}>
                <Leaf className="w-3 h-3" />
                <span>{recipe.isVegetarian ? 'Veg' : 'Non-Veg'}</span>
              </div>
            )}

            {recipe.isFeatured && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">
                <TrendingUp className="w-3 h-3" />
                <span>Featured</span>
              </div>
            )}

            {recipe.categoryName && (
              <div className="px-2 py-1 rounded-lg text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                {recipe.categoryName}
              </div>
            )}
          </div>

          {/* Price (if available) */}
          {recipe.price > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
                <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                  ₹{recipe.price.toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
        </Link>

        {/* Webpage Link Button (if no video but has recipe URL) */}
        {!hasVideo && hasRecipeUrl && (
          <div className="p-4 pt-0">
            <a
              href={recipe.recipeUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Recipe on Web</span>
            </a>
          </div>
        )}
      </div>
    </motion.div>
  );
}

