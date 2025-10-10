import { Category } from '@prisma/client';

export type CategoryWithCount = Category & {
  _count: {
    items: number;
  };
};

export interface CategoryStats {
  category: Category;
  itemCount: number;
  totalValue: number;
}
