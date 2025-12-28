'use client';

import { Suspense } from 'react';
import AppHeader from './AppHeader';

export default function AppHeaderWrapper() {
  // Wrap in Suspense to handle usePathname() SSR issues
  return (
    <Suspense fallback={<header className="h-14 bg-gradient-to-r from-primary-600 to-primary-700" />}>
      <AppHeader />
    </Suspense>
  );
}

