import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, validatePassword, validateEmail } from '@/lib/auth-utils';

describe('Auth Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'Test123!';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(hashed).not.toBe(password);
      expect(hashed).toHaveLength(60); // bcrypt hash length
      expect(hashed).toMatch(/^\$2[aby]\$/); // bcrypt format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'Test123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const password = 'Test123!';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword(password, hashed);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'Test123!';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword('WrongPassword123!', hashed);

      expect(isValid).toBe(false);
    });

    it('should handle empty password', async () => {
      const password = 'Test123!';
      const hashed = await hashPassword(password);
      const isValid = await verifyPassword('', hashed);

      expect(isValid).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid password', () => {
      expect(validatePassword('Test123!')).toBe(true);
      expect(validatePassword('Password1')).toBe(true);
      expect(validatePassword('Secure123')).toBe(true);
    });

    it('should reject password without uppercase', () => {
      expect(validatePassword('test123!')).toBe(false);
    });

    it('should reject password without lowercase', () => {
      expect(validatePassword('TEST123!')).toBe(false);
    });

    it('should reject password without number', () => {
      expect(validatePassword('TestPassword!')).toBe(false);
    });

    it('should reject short password', () => {
      expect(validatePassword('Test12')).toBe(false);
    });

    it('should accept exactly 8 characters', () => {
      expect(validatePassword('Test1234')).toBe(true);
    });
  });

  describe('validateEmail', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('admin+tag@example.org')).toBe(true);
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('notanemail')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('user @example.com')).toBe(false);
    });

    it('should reject empty email', () => {
      expect(validateEmail('')).toBe(false);
    });
  });
});
