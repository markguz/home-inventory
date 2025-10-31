export interface Item {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  minQuantity: number | null;
  purchaseDate: Date | null;
  purchasePrice: number | null;
  currentValue: number | null;
  condition: string | null;
  notes: string | null;
  imageUrl: string | null;
  barcode: string | null;
  serialNumber: string | null;
  warrantyUntil: Date | null;
  userId: string;
  categoryId: string;
  locationId: string;
  category: {
    id: string;
    name: string;
    minQuantity?: number | null;
  };
  location: {
    id: string;
    name: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  minQuantity?: number | null;
}

export interface Location {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
}

export interface ItemFormData {
  name: string;
  description?: string;
  categoryId: string;
  locationId: string;
  quantity: number;
  minQuantity?: number;
  purchaseDate?: Date;
  purchasePrice?: number;
  currentValue?: number;
  condition?: string;
  notes?: string;
  imageUrl?: string;
  barcode?: string;
  serialNumber?: string;
  warrantyUntil?: Date;
}

export type ItemWithRelations = Item;

export interface Tag {
  id: string;
  name: string;
  color?: string;
}
