import { Item, Category, Location, Tag, ItemTag } from '@prisma/client';

export type ItemWithRelations = Item & {
  category: Category;
  location: Location;
  tags: (ItemTag & { tag: Tag })[];
};

export type ItemListItem = Item & {
  category: Category;
  location: Location;
  tags: (ItemTag & { tag: Tag })[];
  _count?: {
    tags: number;
  };
};

export type ItemCondition = 'excellent' | 'good' | 'fair' | 'poor';

export interface ItemFilters {
  query?: string;
  categoryId?: string;
  locationId?: string;
  tagIds?: string[];
  condition?: ItemCondition;
  minValue?: number;
  maxValue?: number;
}

export interface ItemSort {
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'purchasePrice' | 'currentValue';
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
