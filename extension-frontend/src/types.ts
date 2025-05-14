export interface SavedTimestamp {
  url: string;
  timestamp: number;
  title?: string;
  lastAccessed: number;
}

export interface TimestampStore {
  [key: string]: SavedTimestamp;
}

export interface ChromeMessage {
  type: 'GET_TIMESTAMPS' | 'CLEAR_TIMESTAMP' | 'CLEAR_ALL';
  url?: string;
} 