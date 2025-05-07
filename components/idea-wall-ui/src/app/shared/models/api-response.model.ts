export interface Pagination {
  skip: number;
  limit: number;
  total: number;
}

export interface ErrorDetail {
  code: number;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  pagination?: Pagination;
  error?: ErrorDetail;
} 