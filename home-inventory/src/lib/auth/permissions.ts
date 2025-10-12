import { auth } from '@/auth';
import { redirect } from 'next/navigation';

/**
 * Server-side authentication check
 * Redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  return session;
}

/**
 * Server-side admin check
 * Redirects to home if not admin
 */
export async function requireAdmin() {
  const session = await requireAuth();

  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return session;
}

/**
 * Check if user has admin role
 */
export function isAdmin(role?: string): boolean {
  return role === 'ADMIN';
}

/**
 * Check if user is owner of a resource
 */
export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Check if user can access a resource
 * Admins can access everything, users can only access their own resources
 */
export function canAccess(userId: string, resourceOwnerId: string, role?: string): boolean {
  return isAdmin(role) || isOwner(userId, resourceOwnerId);
}
