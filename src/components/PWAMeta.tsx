'use client';

import { useEffect } from 'react';

export default function PWAMeta() {
  useEffect(() => {
    // Add PWA meta tags that aren't handled by Next.js metadata API
    const addMetaTag = (name: string, content: string, attribute: string = 'name') => {
      if (!document.querySelector(`meta[${attribute}="${name}"]`)) {
        const meta = document.createElement('meta');
        meta.setAttribute(attribute, name);
        meta.setAttribute('content', content);
        document.head.appendChild(meta);
      }
    };

    // Add manifest link
    if (!document.querySelector('link[rel="manifest"]')) {
      const link = document.createElement('link');
      link.rel = 'manifest';
      link.href = '/manifest.json';
      document.head.appendChild(link);
    }

    // Add Apple touch icon
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const link = document.createElement('link');
      link.rel = 'apple-touch-icon';
      link.href = '/icons/icon-192x192.png';
      link.sizes = '192x192';
      document.head.appendChild(link);
    }

    // Add favicon
    if (!document.querySelector('link[rel="icon"]')) {
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      link.sizes = '192x192';
      link.href = '/icons/icon-192x192.png';
      document.head.appendChild(link);
    }

    // Add PWA meta tags
    addMetaTag('theme-color', '#1D828E');
    addMetaTag('apple-mobile-web-app-capable', 'yes');
    addMetaTag('apple-mobile-web-app-status-bar-style', 'default');
    addMetaTag('apple-mobile-web-app-title', 'FlowCart');
  }, []);

  return null;
}

