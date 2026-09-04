export type ApiStatus = 'success' | 'partial' | 'no_data' | 'error' | 'timeout' | 'not_applicable';

export interface ApiResult<T> {
  data: T | null;
  isFallback: boolean;
  confidenceLevel: 'high' | 'medium' | 'low';
  reason?: string;
  sourceName: string;
  status?: ApiStatus;
}
