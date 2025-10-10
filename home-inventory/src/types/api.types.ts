export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  statusCode: number;
  details?: unknown;
}

export type ApiResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface SearchQuery {
  q?: string;
  category?: string;
  location?: string;
  tags?: string[];
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
