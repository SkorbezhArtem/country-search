import { describe, expect, it } from 'vitest';
import { createSearchHistory } from './searchHistory.js';

const DEFAULT_KEY = 'country-search:history';
const DEFAULT_LIMIT = 8;

function createFakeStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));

  return {
    data,
    getItem: (key: string): string | null => data.get(key) ?? null,
    setItem: (key: string, value: string): void => {
      data.set(key, value);
    },
    removeItem: (key: string): void => {
      data.delete(key);
    },
  };
}

function storedList(storage: ReturnType<typeof createFakeStorage>, key = DEFAULT_KEY): unknown {
  const raw = storage.data.get(key);

  return raw === undefined ? undefined : JSON.parse(raw);
}

describe('createSearchHistory', () => {
  it('starts empty when nothing is stored', () => {
    expect(createSearchHistory(createFakeStorage()).getAll()).toEqual([]);
  });

  it('keeps the newest query first', () => {
    const history = createSearchHistory(createFakeStorage());

    history.add('spain');
    history.add('france');

    expect(history.getAll()).toEqual(['france', 'spain']);
  });

  it('moves a repeated query to the front without duplicating it', () => {
    const history = createSearchHistory(createFakeStorage());

    history.add('spain');
    history.add('france');
    history.add('spain');

    expect(history.getAll()).toEqual(['spain', 'france']);
  });

  it('treats queries that differ only in case or outer spaces as the same and keeps the latest spelling', () => {
    const history = createSearchHistory(createFakeStorage());

    history.add('Spain');
    history.add('  spain  ');

    expect(history.getAll()).toEqual(['spain']);
  });

  it('ignores a blank query and writes nothing', () => {
    const storage = createFakeStorage();
    const history = createSearchHistory(storage);

    history.add('');
    history.add('   ');

    expect(history.getAll()).toEqual([]);
    expect(storage.data.size).toBe(0);
  });

  it('keeps only the most recent entries up to the limit', () => {
    const history = createSearchHistory(createFakeStorage(), { limit: 3 });

    for (const query of ['a', 'b', 'c', 'd']) {
      history.add(query);
    }

    expect(history.getAll()).toEqual(['d', 'c', 'b']);
  });

  it('keeps 8 entries by default', () => {
    const history = createSearchHistory(createFakeStorage());

    for (let i = 1; i <= 10; i++) {
      history.add(`query ${i}`);
    }

    const all = history.getAll();

    expect(all).toHaveLength(DEFAULT_LIMIT);
    expect(all[0]).toBe('query 10');
    expect(all.at(-1)).toBe('query 3');
  });

  it('persists the list in storage, newest first', () => {
    const storage = createFakeStorage();
    const history = createSearchHistory(storage);

    history.add('spain');
    history.add('france');

    expect(storedList(storage)).toEqual(['france', 'spain']);
  });

  it('uses a custom storage key', () => {
    const storage = createFakeStorage();
    const history = createSearchHistory(storage, { key: 'custom' });

    history.add('spain');

    expect(storedList(storage, 'custom')).toEqual(['spain']);
    expect(storage.data.has(DEFAULT_KEY)).toBe(false);
  });

  it('restores the list from storage in a new instance', () => {
    const storage = createFakeStorage();
    const first = createSearchHistory(storage);
    first.add('spain');
    first.add('france');

    const second = createSearchHistory(storage);

    expect(second.getAll()).toEqual(['france', 'spain']);
  });

  it.each(['not json', '{"a":1}', '"text"', 'null'])(
    'starts empty when the stored value is %j',
    (stored) => {
      const storage = createFakeStorage({ [DEFAULT_KEY]: stored });

      expect(createSearchHistory(storage).getAll()).toEqual([]);
    },
  );

  it('drops stored entries that are not non-blank strings', () => {
    const storage = createFakeStorage({
      [DEFAULT_KEY]: JSON.stringify(['spain', 42, null, '  ', 'france']),
    });

    expect(createSearchHistory(storage).getAll()).toEqual(['spain', 'france']);
  });

  it('trims a stored list that is longer than the limit', () => {
    const storage = createFakeStorage({
      [DEFAULT_KEY]: JSON.stringify(['a', 'b', 'c', 'd', 'e']),
    });

    expect(createSearchHistory(storage, { limit: 2 }).getAll()).toEqual(['a', 'b']);
  });

  it('keeps working in memory when writing to storage fails', () => {
    const storage = {
      ...createFakeStorage(),
      setItem: (): void => {
        throw new Error('QuotaExceededError');
      },
    };
    const history = createSearchHistory(storage);

    expect(() => {
      history.add('spain');
    }).not.toThrow();
    expect(history.getAll()).toEqual(['spain']);
  });

  it('starts empty when reading from storage fails', () => {
    const storage = {
      ...createFakeStorage(),
      getItem: (): string | null => {
        throw new Error('SecurityError');
      },
    };

    expect(createSearchHistory(storage).getAll()).toEqual([]);
  });

  it('clears the list and the stored value', () => {
    const storage = createFakeStorage();
    const history = createSearchHistory(storage);
    history.add('spain');

    history.clear();

    expect(history.getAll()).toEqual([]);
    expect(storage.data.has(DEFAULT_KEY)).toBe(false);
  });

  it('returns a copy so callers cannot change the history', () => {
    const history = createSearchHistory(createFakeStorage());
    history.add('spain');

    history.getAll().push('hacked');

    expect(history.getAll()).toEqual(['spain']);
  });
});
