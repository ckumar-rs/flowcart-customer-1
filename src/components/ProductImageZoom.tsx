'use client';

import { useState } from 'react';
import SafeImage from './SafeImage';
import { X, ZoomIn } from 'lucide-react';

interface ProductImageZoomProps {
  src: string;
  alt: string;
  className?: string;
}

export default function ProductImageZoom({ src, alt, className = '' }: ProductImageZoomProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!src) {
    return (
      <div className={`bg-gray-100 flex items-center justify-center ${className}`}>
        <span className="text-gray-400">No image</span>
      </div>
    );
  }

  return (
    <>
      <div className="relative group cursor-pointer" onClick={() => setIsZoomed(true)}>
        <SafeImage
          src={src}
          alt={alt}
          width={400}
          height={400}
          className={`object-cover ${className}`}
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity flex items-center justify-center">
          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      {/* Zoom Modal */}
      {isZoomed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsZoomed(false)}
        >
          <button
            onClick={() => setIsZoomed(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Close zoom"
          >
            <X className="w-8 h-8" />
          </button>
          <div className="relative max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <SafeImage
              src={src}
              alt={alt}
              width={1200}
              height={1200}
              className="max-w-full max-h-[90vh] object-contain"
              priority
              objectFit="contain"
            />
          </div>
        </div>
      )}
    </>
  );
}

