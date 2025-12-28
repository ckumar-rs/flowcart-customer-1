'use client';

import Image from 'next/image';
import { useState } from 'react';

interface SafeImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onClick?: () => void;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
}

/**
 * SafeImage component that falls back to regular img tag if Next.js Image Optimization fails
 * This is useful for external images that might not work with Next.js Image Optimization
 */
export default function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className = '',
  sizes,
  priority = false,
  onLoad,
  onClick,
  objectFit = 'cover',
}: SafeImageProps) {
  const [useFallback, setUseFallback] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleError = () => {
    // If Next.js Image Optimization fails, use regular img tag
    setUseFallback(true);
  };

  const handleLoad = () => {
    setImageLoaded(true);
    onLoad?.();
  };

  // If we've already failed, use regular img tag
  if (useFallback) {
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{ objectFit }}
          onLoad={handleLoad}
          onClick={onClick}
          onError={() => {
            // Even fallback failed, show placeholder
            setImageLoaded(false);
          }}
        />
      );
    }
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={{ objectFit }}
        onLoad={handleLoad}
        onClick={onClick}
        onError={() => {
          setImageLoaded(false);
        }}
      />
    );
  }

  // Try Next.js Image Optimization first
  try {
    if (fill) {
      return (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse" />
          )}
          <Image
            src={src}
            alt={alt}
            fill
            className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
            sizes={sizes}
            priority={priority}
            onLoad={handleLoad}
            onError={handleError}
            onClick={onClick}
            style={{ objectFit }}
          />
        </>
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        onClick={onClick}
        style={{ objectFit }}
      />
    );
  } catch (error) {
    // If Image component fails to initialize, use fallback
    setUseFallback(true);
    if (fill) {
      return (
        <img
          src={src}
          alt={alt}
          className={className}
          style={{ objectFit }}
          onLoad={handleLoad}
          onClick={onClick}
        />
      );
    }
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={{ objectFit }}
        onLoad={handleLoad}
        onClick={onClick}
      />
    );
  }
}

