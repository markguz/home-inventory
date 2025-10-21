'use client';

import { usePathname } from 'next/navigation';
import { Header } from './Header';

export function ConditionalHeader() {
  const pathname = usePathname();

  // Don't render header on auth routes
  const isAuthRoute = pathname?.startsWith('/login') || pathname?.startsWith('/register');

  if (isAuthRoute) {
    return null;
  }

  return <Header />;
}
