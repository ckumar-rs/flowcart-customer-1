'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/utils/pwa';

export default function PWARegister() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}

