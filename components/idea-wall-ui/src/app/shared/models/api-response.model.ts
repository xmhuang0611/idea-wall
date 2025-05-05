export interface Pagination {
  page: number;
  page_size: number;
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