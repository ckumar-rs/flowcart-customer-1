'use client';

import { useState } from 'react';
import { Play, X, Youtube, Video } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProductVideoProps {
  videoUrl?: string;
  productName: string;
}

export default function ProductVideo({ videoUrl, productName }: ProductVideoProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!videoUrl) return null;

  // Extract YouTube video ID if it's a YouTube URL
  const getYouTubeId = (url: string): string | null => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be');
  const youtubeId = isYouTube ? getYouTubeId(videoUrl) : null;
  const embedUrl = youtubeId ? `https://www.youtube.com/embed/${youtubeId}` : videoUrl;

  return (
    <>
      {/* Video Thumbnail Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="group relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 border-2 border-gray-200 dark:border-gray-700 hover:border-primary-400 dark:hover:border-primary-600"
      >
        {/* Thumbnail or Placeholder */}
        {youtubeId ? (
          <img
            src={`https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`}
            alt={`${productName} video thumbnail`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to default thumbnail
              (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/30">
            <Video className="w-16 h-16 text-primary-600 dark:text-primary-400 opacity-50" />
          </div>
        )}

        {/* Play Button Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-20 h-20 bg-white/90 dark:bg-gray-800/90 rounded-full flex items-center justify-center shadow-2xl backdrop-blur-sm"
          >
            <Play className="w-10 h-10 text-primary-600 dark:text-primary-400 ml-1" fill="currentColor" />
          </motion.div>
        </div>

        {/* Video Label */}
        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-lg px-3 py-2">
            {isYouTube ? (
              <Youtube className="w-5 h-5 text-red-600" />
            ) : (
              <Video className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            )}
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {isYouTube ? 'Watch on YouTube' : 'Watch Video'}
            </span>
          </div>
        </div>
      </button>

      {/* Video Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              {/* Modal Content */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-4xl bg-black rounded-2xl overflow-hidden shadow-2xl"
              >
                {/* Close Button */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-colors"
                  aria-label="Close video"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Video Player */}
                <div className="relative w-full aspect-video bg-black">
                  <iframe
                    src={embedUrl}
                    title={`${productName} preparation video`}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="absolute inset-0 w-full h-full"
                  />
                </div>

                {/* Video Title */}
                <div className="p-4 bg-gray-900">
                  <h3 className="text-white font-semibold text-lg">{productName}</h3>
                  <p className="text-gray-400 text-sm mt-1">Preparation Video</p>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

