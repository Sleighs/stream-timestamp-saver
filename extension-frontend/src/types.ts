export interface SavedTimestamp {
  url: string;
  timestamp: number;
  title?: string;
  lastAccessed: number;
  videoId: string;
  channelName?: string;
  sessionId: string;
  watchHistory: Array<{
    time: number;
    formattedTime: string;
    timestamp: number;
  }>;
}

export interface TimestampStore {
  [key: string]: SavedTimestamp;
}

export interface Session {
  id: string;
  startTime: number;
  endTime?: number;
  videoIds: string[];
}

export interface SessionStore {
  [key: string]: Session;
}

export interface ChromeMessage {
  type: 'GET_TIMESTAMPS' | 'CLEAR_TIMESTAMP' | 'CLEAR_ALL';
  url?: string;
} 