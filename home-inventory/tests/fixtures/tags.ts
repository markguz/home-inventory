import { Tag } from '@/types';

export const mockTag = {
  id: 'tag_123',
  name: 'Important',
  color: '#EF4444',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockTagWithoutColor = {
  id: 'tag_456',
  name: 'Fragile',
  color: null,
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
};

export const mockTagBlue = {
  id: 'tag_789',
  name: 'Electronics',
  color: '#3B82F6',
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-03'),
};

export const mockTags: Tag[] = [
  mockTag,
  mockTagWithoutColor,
  mockTagBlue,
];

export const mockTagFormData = {
  name: 'Test Tag',
  color: '#FF5733',
};
