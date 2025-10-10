import { describe, it, expect } from 'vitest';
import { cn } from '@/lib/utils';

describe('Utils Library', () => {
  describe('cn (className merger)', () => {
    it('should merge class names correctly', () => {
      expect(cn('text-red-500', 'bg-blue-500')).toBe('text-red-500 bg-blue-500');
    });

    it('should handle conditional classes', () => {
      expect(cn('base', true && 'active', false && 'disabled')).toBe(
        'base active'
      );
    });

    it('should deduplicate Tailwind classes', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('should handle undefined and null values', () => {
      expect(cn('base', undefined, null, 'extra')).toBe('base extra');
    });

    it('should handle arrays of classes', () => {
      expect(cn(['text-lg', 'font-bold'], 'text-center')).toBe(
        'text-lg font-bold text-center'
      );
    });
  });

});
