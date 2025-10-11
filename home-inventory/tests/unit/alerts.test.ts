/**
 * Unit Tests: Consumables Alert Logic
 * Tests the core alert calculation and threshold logic
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  mockItemsWithMinQuantity,
  mockAlertThresholds,
  testScenarios,
  createMockItem,
  type AlertLevel,
  type ItemWithAlert,
} from '../fixtures/alert-fixtures';

/**
 * Calculate alert level based on current quantity and minimum quantity
 * This is the core business logic that should be implemented
 */
function calculateAlertLevel(item: ItemWithAlert): AlertLevel {
  const { quantity, minQuantity } = item;

  // No alert if minQuantity is not set or is zero
  if (!minQuantity || minQuantity === 0) {
    return 'none';
  }

  // Calculate stock percentage
  const stockPercentage = (quantity / minQuantity) * 100;

  // Critical: 0% or below 50%
  if (quantity === 0 || stockPercentage <= 50) {
    return 'critical';
  }

  // Warning: between 50% and 100% (inclusive)
  if (stockPercentage <= 100) {
    return 'warning';
  }

  // OK: above 100%
  return 'ok';
}

/**
 * Get all items with low stock alerts
 * Should return items where quantity <= minQuantity
 */
function getItemsWithLowStock(items: ItemWithAlert[]): ItemWithAlert[] {
  return items.filter((item) => {
    const alertLevel = calculateAlertLevel(item);
    return alertLevel === 'critical' || alertLevel === 'warning';
  });
}

/**
 * Calculate stock percentage for an item
 */
function calculateStockPercentage(item: ItemWithAlert): number {
  if (!item.minQuantity || item.minQuantity === 0) {
    return 100;
  }
  return Math.max(0, (item.quantity / item.minQuantity) * 100);
}

describe('Alert Logic - Unit Tests', () => {
  describe('calculateAlertLevel', () => {
    it('should return "critical" for zero quantity', () => {
      const item = testScenarios.criticalAlert.item;
      const level = calculateAlertLevel(item);
      expect(level).toBe('critical');
    });

    it('should return "critical" for quantity below 50% of minQuantity', () => {
      const item = createMockItem({ quantity: 2, minQuantity: 5 });
      const level = calculateAlertLevel(item);
      expect(level).toBe('critical');
    });

    it('should return "warning" for quantity equal to minQuantity', () => {
      const item = testScenarios.warningAlert.item;
      const level = calculateAlertLevel(item);
      expect(level).toBe('warning');
    });

    it('should return "warning" for quantity between 50% and 100% of minQuantity', () => {
      const item = createMockItem({ quantity: 8, minQuantity: 10 });
      const level = calculateAlertLevel(item);
      expect(level).toBe('warning');
    });

    it('should return "ok" for quantity above minQuantity', () => {
      const item = testScenarios.okStock.item;
      const level = calculateAlertLevel(item);
      expect(level).toBe('ok');
    });

    it('should return "none" for item without minQuantity', () => {
      const item = testScenarios.noMinQuantity.item;
      const level = calculateAlertLevel(item);
      expect(level).toBe('none');
    });

    it('should return "none" for item with zero minQuantity', () => {
      const item = testScenarios.zeroMinQuantity.item;
      const level = calculateAlertLevel(item);
      expect(level).toBe('none');
    });

    it('should handle negative quantity as critical', () => {
      const item = testScenarios.negativeQuantity.item;
      const level = calculateAlertLevel(item);
      expect(level).toBe('critical');
    });

    it('should return "critical" for exactly 50% stock', () => {
      const item = createMockItem({ quantity: 5, minQuantity: 10 });
      const level = calculateAlertLevel(item);
      expect(level).toBe('critical');
    });

    it('should return "warning" for exactly 100% stock', () => {
      const item = createMockItem({ quantity: 10, minQuantity: 10 });
      const level = calculateAlertLevel(item);
      expect(level).toBe('warning');
    });
  });

  describe('getItemsWithLowStock', () => {
    const allItems = Object.values(mockItemsWithMinQuantity);

    it('should return only items with critical or warning alerts', () => {
      const lowStockItems = getItemsWithLowStock(allItems);

      expect(lowStockItems.length).toBeGreaterThan(0);
      lowStockItems.forEach((item) => {
        const level = calculateAlertLevel(item);
        expect(['critical', 'warning']).toContain(level);
      });
    });

    it('should not include items with ok stock levels', () => {
      const lowStockItems = getItemsWithLowStock(allItems);

      lowStockItems.forEach((item) => {
        const level = calculateAlertLevel(item);
        expect(level).not.toBe('ok');
      });
    });

    it('should not include items without minQuantity', () => {
      const lowStockItems = getItemsWithLowStock(allItems);

      lowStockItems.forEach((item) => {
        expect(item.minQuantity).toBeTruthy();
        expect(item.minQuantity).toBeGreaterThan(0);
      });
    });

    it('should return empty array when all items have sufficient stock', () => {
      const wellStockedItems = [
        createMockItem({ quantity: 100, minQuantity: 10 }),
        createMockItem({ quantity: 50, minQuantity: 5 }),
      ];

      const lowStockItems = getItemsWithLowStock(wellStockedItems);
      expect(lowStockItems).toHaveLength(0);
    });

    it('should handle empty array input', () => {
      const lowStockItems = getItemsWithLowStock([]);
      expect(lowStockItems).toHaveLength(0);
    });

    it('should include coffee beans with critical alert', () => {
      const lowStockItems = getItemsWithLowStock(allItems);
      const coffeeBeans = lowStockItems.find((item) => item.id === mockItemsWithMinQuantity.coffeeBeans.id);

      expect(coffeeBeans).toBeDefined();
      expect(calculateAlertLevel(coffeeBeans!)).toBe('critical');
    });

    it('should include trash bags with warning alert', () => {
      const lowStockItems = getItemsWithLowStock(allItems);
      const trashBags = lowStockItems.find((item) => item.id === mockItemsWithMinQuantity.trashBags.id);

      expect(trashBags).toBeDefined();
      expect(calculateAlertLevel(trashBags!)).toBe('warning');
    });

    it('should not include paper towels with ok stock', () => {
      const lowStockItems = getItemsWithLowStock(allItems);
      const paperTowels = lowStockItems.find((item) => item.id === mockItemsWithMinQuantity.paperTowels.id);

      expect(paperTowels).toBeUndefined();
    });
  });

  describe('calculateStockPercentage', () => {
    it('should calculate correct percentage for normal cases', () => {
      const item = createMockItem({ quantity: 5, minQuantity: 10 });
      const percentage = calculateStockPercentage(item);
      expect(percentage).toBe(50);
    });

    it('should return 0 for zero quantity', () => {
      const item = createMockItem({ quantity: 0, minQuantity: 10 });
      const percentage = calculateStockPercentage(item);
      expect(percentage).toBe(0);
    });

    it('should return 100 for item without minQuantity', () => {
      const item = createMockItem({ quantity: 5, minQuantity: null });
      const percentage = calculateStockPercentage(item);
      expect(percentage).toBe(100);
    });

    it('should return 100 for item with zero minQuantity', () => {
      const item = createMockItem({ quantity: 5, minQuantity: 0 });
      const percentage = calculateStockPercentage(item);
      expect(percentage).toBe(100);
    });

    it('should handle percentages over 100', () => {
      const item = createMockItem({ quantity: 15, minQuantity: 10 });
      const percentage = calculateStockPercentage(item);
      expect(percentage).toBe(150);
    });

    it('should not return negative percentages', () => {
      const item = createMockItem({ quantity: -5, minQuantity: 10 });
      const percentage = calculateStockPercentage(item);
      expect(percentage).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large quantities', () => {
      const item = createMockItem({ quantity: 1000000, minQuantity: 10 });
      const level = calculateAlertLevel(item);
      expect(level).toBe('ok');
    });

    it('should handle very small minQuantity', () => {
      const item = createMockItem({ quantity: 0, minQuantity: 1 });
      const level = calculateAlertLevel(item);
      expect(level).toBe('critical');
    });

    it('should handle fractional calculations correctly', () => {
      const item = createMockItem({ quantity: 3, minQuantity: 7 });
      const percentage = calculateStockPercentage(item);
      expect(percentage).toBeCloseTo(42.86, 1);
    });

    it('should handle null values gracefully', () => {
      const item = createMockItem({ quantity: 10, minQuantity: null });
      expect(() => calculateAlertLevel(item)).not.toThrow();
      expect(calculateAlertLevel(item)).toBe('none');
    });
  });

  describe('Alert Threshold Consistency', () => {
    it('should have consistent thresholds across all test scenarios', () => {
      Object.values(testScenarios).forEach((scenario) => {
        const level = calculateAlertLevel(scenario.item);
        expect(level).toBe(scenario.expectedLevel);
      });
    });

    it('should maintain alert levels when sorting by quantity', () => {
      const items = [
        createMockItem({ quantity: 0, minQuantity: 10 }),
        createMockItem({ quantity: 3, minQuantity: 10 }),
        createMockItem({ quantity: 8, minQuantity: 10 }),
        createMockItem({ quantity: 15, minQuantity: 10 }),
      ];

      const levels = items.map(calculateAlertLevel);
      expect(levels).toEqual(['critical', 'critical', 'warning', 'ok']);
    });
  });
});
