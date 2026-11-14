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

const DEFAULT_KEY = 'country-search:history';
const DEFAULT_LIMIT = 8;

function isNonBlankString(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function load(storage: HistoryStorage, key: string, limit: number): string[] {
  try {
    const raw = storage.getItem(key);

    if (raw === null) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? parsed.filter(isNonBlankString).slice(0, limit) : [];
  } catch {
    // Unreadable storage or broken JSON: start with an empty history.
    return [];
  }
}

function save(storage: HistoryStorage, key: string, entries: string[]): void {
  try {
    storage.setItem(key, JSON.stringify(entries));
  } catch {
    // Storage is full or blocked: the history still works in memory.
  }
}

export function createSearchHistory(
  storage: HistoryStorage,
  { key = DEFAULT_KEY, limit = DEFAULT_LIMIT }: SearchHistoryOptions = {},
): SearchHistory {
  let entries = load(storage, key, limit);

  return {
    getAll() {
      return [...entries];
    },

    add(query) {
      const text = query.trim();

      if (text === '') {
        return;
      }

      const normalized = text.toLowerCase();
      const others = entries.filter((entry) => entry.toLowerCase() !== normalized);

      entries = [text, ...others].slice(0, limit);
      save(storage, key, entries);
    },

    clear() {
      entries = [];

      try {
        storage.removeItem(key);
      } catch {
        // Nothing to clean up if storage is blocked.
      }
    },
  };
}
