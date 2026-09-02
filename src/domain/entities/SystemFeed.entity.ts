export interface SystemFeedEntity {
  id: string;
  feedName: string;
  provider: string;
  resolution: string;
  latencyMs: number;
  status: 'LIVE' | 'SYNCING' | 'MAINTENANCE';
  lastSync: string;
  updatedAt?: string;
}
