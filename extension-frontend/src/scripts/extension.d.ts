export function openOptions(): Promise<void>;
export function saveOptions(data: unknown): Promise<void>;
export function getOptions(): Promise<unknown>;
export function getSavedTimestamps(): Promise<Record<string, { timestamp: number; lastAccessed: number; }> | null>;
export function saveTimestamp(url: string, timestamp: number): Promise<void>;
export function clearTimestamp(url: string): Promise<void>;
export function clearAllTimestamps(): Promise<void>;
export function updateIcon(enabled: boolean): Promise<void>; 