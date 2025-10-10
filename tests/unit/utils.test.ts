import { formatCurrency, formatDate, calculateAge, slugify, truncateText } from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format number as USD currency', () => {
      expect(formatCurrency(1299.99)).toBe('$1,299.99');
      expect(formatCurrency(0)).toBe('$0.00');
      expect(formatCurrency(1000000)).toBe('$1,000,000.00');
    });

    it('should handle negative values', () => {
      expect(formatCurrency(-50.5)).toBe('-$50.50');
    });

    it('should handle decimal precision', () => {
      expect(formatCurrency(10.1)).toBe('$10.10');
      expect(formatCurrency(10.999)).toBe('$11.00');
    });
  });

  describe('formatDate', () => {
    it('should format date as MM/DD/YYYY', () => {
      const date = new Date('2023-01-15');
      expect(formatDate(date)).toBe('01/15/2023');
    });

    it('should handle ISO string dates', () => {
      expect(formatDate('2023-12-25')).toBe('12/25/2023');
    });

    it('should handle invalid dates', () => {
      expect(formatDate('invalid')).toBe('Invalid Date');
    });
  });

  describe('calculateAge', () => {
    it('should calculate age in years', () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
      expect(calculateAge(twoYearsAgo)).toBe(2);
    });

    it('should return 0 for current date', () => {
      expect(calculateAge(new Date())).toBe(0);
    });

    it('should handle dates less than a year old', () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      expect(calculateAge(sixMonthsAgo)).toBe(0);
    });
  });

  describe('slugify', () => {
    it('should convert string to URL-safe slug', () => {
      expect(slugify('Hello World')).toBe('hello-world');
      expect(slugify('Test Item 123')).toBe('test-item-123');
    });

    it('should remove special characters', () => {
      expect(slugify('Item @ $100!')).toBe('item-100');
    });

    it('should handle multiple spaces', () => {
      expect(slugify('Too   Many    Spaces')).toBe('too-many-spaces');
    });

    it('should handle empty strings', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('truncateText', () => {
    it('should truncate text to specified length', () => {
      const longText = 'This is a very long description that needs to be truncated';
      expect(truncateText(longText, 20)).toBe('This is a very long...');
    });

    it('should not truncate short text', () => {
      expect(truncateText('Short', 10)).toBe('Short');
    });

    it('should handle exact length match', () => {
      expect(truncateText('Exactly20Characters!', 20)).toBe('Exactly20Characters!');
    });
  });
});
