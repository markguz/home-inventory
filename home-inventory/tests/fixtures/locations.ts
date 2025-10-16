import { Location } from '@/types';

export const mockLocation = {
  id: 'loc_123',
  name: 'Living Room',
  description: 'Main living area with TV and couch',
  parentId: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockLocationWithParent = {
  id: 'loc_456',
  name: 'TV Stand',
  description: 'Entertainment center in living room',
  parentId: 'loc_123',
  createdAt: new Date('2024-01-02'),
  updatedAt: new Date('2024-01-02'),
};

export const mockLocationMinimal = {
  id: 'loc_789',
  name: 'Garage',
  description: null,
  parentId: null,
  createdAt: new Date('2024-01-03'),
  updatedAt: new Date('2024-01-03'),
};

export const mockLocations: Location[] = [
  mockLocation,
  mockLocationWithParent,
  mockLocationMinimal,
];

export const mockLocationFormData = {
  name: 'Test Location',
  description: 'Test description',
  parentId: null,
};
