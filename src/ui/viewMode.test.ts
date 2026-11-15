import { describe, expect, it } from 'vitest';
import { loadViewMode, saveViewMode } from './viewMode.js';

const KEY = 'country-search:view';

function createFakeStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));

  return {
    data,
    getItem: (key: string): string | null => data.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      data.set(key, value);
    },
  };
}

describe('loadViewMode', () => {
  it('returns "cards" when nothing is stored', () => {
    expect(loadViewMode(createFakeStorage())).toBe('cards');
  });

  it.each(['cards', 'list'])('returns the stored "%s" mode', (mode) => {
    expect(loadViewMode(createFakeStorage({ [KEY]: mode }))).toBe(mode);
  });

  it.each(['grid', '', 'LIST', '{"mode":"list"}'])(
    'falls back to "cards" for the stored value %j',
    (stored) => {
      expect(loadViewMode(createFakeStorage({ [KEY]: stored }))).toBe('cards');
    },
  );

  it('falls back to "cards" when reading from storage fails', () => {
    const storage = {
      getItem: (): string | null => {
        throw new Error('SecurityError');
      },
      setItem: (): void => undefined,
    };

    expect(loadViewMode(storage)).toBe('cards');
  });
});

describe('saveViewMode', () => {
  it('stores the mode under its key', () => {
    const storage = createFakeStorage();

    saveViewMode(storage, 'list');

    expect(storage.data.get(KEY)).toBe('list');
  });

  it('does not throw when writing to storage fails', () => {
    const storage = {
      getItem: (): string | null => null,
      setItem: (): void => {
        throw new Error('QuotaExceededError');
      },
    };

    expect(() => {
      saveViewMode(storage, 'list');
    }).not.toThrow();
  });
});
