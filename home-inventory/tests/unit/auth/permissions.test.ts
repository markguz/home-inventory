import { describe, it, expect } from 'vitest';
import { isAdmin, isOwner, canAccess } from '@/lib/auth/permissions';

describe('Auth Permissions', () => {
  describe('isAdmin', () => {
    it('should return true for ADMIN role', () => {
      expect(isAdmin('ADMIN')).toBe(true);
    });

    it('should return false for USER role', () => {
      expect(isAdmin('USER')).toBe(false);
    });

    it('should return false for undefined role', () => {
      expect(isAdmin(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isAdmin('')).toBe(false);
    });
  });

  describe('isOwner', () => {
    it('should return true when user is owner', () => {
      const userId = 'user123';
      const resourceOwnerId = 'user123';
      expect(isOwner(userId, resourceOwnerId)).toBe(true);
    });

    it('should return false when user is not owner', () => {
      const userId = 'user123';
      const resourceOwnerId = 'user456';
      expect(isOwner(userId, resourceOwnerId)).toBe(false);
    });
  });

  describe('canAccess', () => {
    it('should allow admin to access any resource', () => {
      const userId = 'admin123';
      const resourceOwnerId = 'user456';
      expect(canAccess(userId, resourceOwnerId, 'ADMIN')).toBe(true);
    });

    it('should allow user to access their own resource', () => {
      const userId = 'user123';
      const resourceOwnerId = 'user123';
      expect(canAccess(userId, resourceOwnerId, 'USER')).toBe(true);
    });

    it('should deny user access to other users resource', () => {
      const userId = 'user123';
      const resourceOwnerId = 'user456';
      expect(canAccess(userId, resourceOwnerId, 'USER')).toBe(false);
    });

    it('should deny access when no role provided', () => {
      const userId = 'user123';
      const resourceOwnerId = 'user456';
      expect(canAccess(userId, resourceOwnerId)).toBe(false);
    });
  });
});
