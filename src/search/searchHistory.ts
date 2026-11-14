export type HistoryStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export interface SearchHistoryOptions {
  key?: string;
  limit?: number;
}

export interface SearchHistory {
  getAll(): string[];
  add(query: string): void;
  clear(): void;
}

export function createSearchHistory(
  storage: HistoryStorage,
  options: SearchHistoryOptions = {},
): SearchHistory {
  void storage;
  void options;
  throw new Error('not implemented');
}
