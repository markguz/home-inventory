'use client';

import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserNav } from './UserNav';

export function AuthButton() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
    );
  }

  if (session?.user) {
    return <UserNav />;
  }

  return (
    <Link href="/login">
      <Button
        variant="ghost"
        size="sm"
        className="flex items-center space-x-2"
        aria-label="Sign in to your account"
      >
        <LogIn className="w-4 h-4" />
        <span>Sign In</span>
      </Button>
    </Link>
  );
}
