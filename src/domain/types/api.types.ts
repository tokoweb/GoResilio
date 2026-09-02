export interface ApiResult<T> {
  data: T | null;
  isFallback: boolean;
  confidenceLevel: 'high' | 'medium' | 'low';
  reason?: string;
  sourceName: string;
}
