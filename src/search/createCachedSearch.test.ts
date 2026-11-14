import { describe, expect, it } from 'vitest';
import { antarctica } from '../api/__fixtures__/antarctica.js';
import { spain } from '../api/__fixtures__/spain.js';
import { mapCountryResponse } from '../api/mapCountryResponse.js';
import type { Country } from '../api/types.js';
import { createCachedSearch } from './createCachedSearch.js';
import type { SearchFn } from './createCachedSearch.js';

const spainResult = mapCountryResponse([spain]);
const antarcticaResult = mapCountryResponse([antarctica]);

interface PendingCall {
  query: string;
  signal: AbortSignal;
  resolve(countries: Country[]): void;
  reject(error: unknown): void;
}

function createFakeSearch(): { search: SearchFn; calls: PendingCall[] } {
  const calls: PendingCall[] = [];

  const search: SearchFn = (query, signal) =>
    new Promise<Country[]>((resolve, reject) => {
      if (signal.aborted) {
        reject(signal.reason);
        return;
      }

      signal.addEventListener(
        'abort',
        () => {
          reject(signal.reason);
        },
        { once: true },
      );

      calls.push({ query, signal, resolve, reject });
    });

  return { search, calls };
}

function callAt(calls: PendingCall[], index: number): PendingCall {
  const call = calls[index];

  if (!call) {
    throw new Error(`call #${index} was not made`);
  }

  return call;
}

function freshSignal(): AbortSignal {
  return new AbortController().signal;
}

describe('createCachedSearch', () => {
  it('passes the query and its own signal to the underlying search and returns the result', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);

    const promise = cachedSearch('spain', freshSignal());
    callAt(calls, 0).resolve(spainResult);

    await expect(promise).resolves.toEqual(spainResult);
    expect(calls).toHaveLength(1);
    expect(callAt(calls, 0).query).toBe('spain');
  });

  it('serves a repeated query from the cache without a second call', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);

    const first = cachedSearch('spain', freshSignal());
    callAt(calls, 0).resolve(spainResult);
    await first;

    await expect(cachedSearch('spain', freshSignal())).resolves.toEqual(spainResult);
    expect(calls).toHaveLength(1);
  });

  it('keeps results of different queries apart', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);

    const first = cachedSearch('spain', freshSignal());
    callAt(calls, 0).resolve(spainResult);
    await first;

    const second = cachedSearch('antarctica', freshSignal());
    callAt(calls, 1).resolve(antarcticaResult);

    await expect(second).resolves.toEqual(antarcticaResult);
    expect(calls).toHaveLength(2);
  });

  it('caches an empty result too', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);

    const first = cachedSearch('zzzz', freshSignal());
    callAt(calls, 0).resolve([]);
    await first;

    await expect(cachedSearch('zzzz', freshSignal())).resolves.toEqual([]);
    expect(calls).toHaveLength(1);
  });

  it('does not cache a failed request', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);

    const first = cachedSearch('spain', freshSignal());
    callAt(calls, 0).reject(new TypeError('Failed to fetch'));
    await expect(first).rejects.toBeInstanceOf(TypeError);

    const second = cachedSearch('spain', freshSignal());
    expect(calls).toHaveLength(2);
    callAt(calls, 1).resolve(spainResult);

    await expect(second).resolves.toEqual(spainResult);
  });

  it('does not cache an aborted request and starts a fresh one next time', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);
    const controller = new AbortController();

    const first = cachedSearch('spain', controller.signal);
    controller.abort();
    await expect(first).rejects.toMatchObject({ name: 'AbortError' });

    const second = cachedSearch('spain', freshSignal());
    expect(calls).toHaveLength(2);
    callAt(calls, 1).resolve(spainResult);

    await expect(second).resolves.toEqual(spainResult);
  });

  it('shares one in-flight request between identical concurrent queries', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);

    const first = cachedSearch('spain', freshSignal());
    const second = cachedSearch('spain', freshSignal());
    expect(calls).toHaveLength(1);

    callAt(calls, 0).resolve(spainResult);

    await expect(first).resolves.toEqual(spainResult);
    await expect(second).resolves.toEqual(spainResult);
  });

  it('does not share in-flight requests of different queries', () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);

    void cachedSearch('spain', freshSignal());
    void cachedSearch('antarctica', freshSignal());

    expect(calls.map((call) => call.query)).toEqual(['spain', 'antarctica']);
  });

  it('rejects only the caller that aborts and keeps the shared request alive', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);
    const quitter = new AbortController();
    const stayer = new AbortController();

    const quitterPromise = cachedSearch('spain', quitter.signal);
    const stayerPromise = cachedSearch('spain', stayer.signal);

    quitter.abort();
    await expect(quitterPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(callAt(calls, 0).signal.aborted).toBe(false);

    callAt(calls, 0).resolve(spainResult);
    await expect(stayerPromise).resolves.toEqual(spainResult);
  });

  it('aborts the shared request only when every caller has aborted', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);
    const first = new AbortController();
    const second = new AbortController();

    const firstPromise = cachedSearch('spain', first.signal);
    const secondPromise = cachedSearch('spain', second.signal);

    first.abort();
    expect(callAt(calls, 0).signal.aborted).toBe(false);

    second.abort();
    expect(callAt(calls, 0).signal.aborted).toBe(true);

    await expect(firstPromise).rejects.toMatchObject({ name: 'AbortError' });
    await expect(secondPromise).rejects.toMatchObject({ name: 'AbortError' });
  });

  it('delivers the same error to every caller of a failed shared request', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);
    const error = new TypeError('Failed to fetch');

    const first = cachedSearch('spain', freshSignal());
    const second = cachedSearch('spain', freshSignal());
    callAt(calls, 0).reject(error);

    await expect(first).rejects.toBe(error);
    await expect(second).rejects.toBe(error);
  });

  it('rejects an already aborted signal without calling the underlying search', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);
    const controller = new AbortController();
    controller.abort();

    await expect(cachedSearch('spain', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    expect(calls).toHaveLength(0);
  });

  it('rejects an already aborted signal even when the result is cached', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);

    const first = cachedSearch('spain', freshSignal());
    callAt(calls, 0).resolve(spainResult);
    await first;

    const controller = new AbortController();
    controller.abort();

    await expect(cachedSearch('spain', controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
  });

  it('keeps the cache intact when a caller aborts after the result has arrived', async () => {
    const { search, calls } = createFakeSearch();
    const cachedSearch = createCachedSearch(search);
    const controller = new AbortController();

    const first = cachedSearch('spain', controller.signal);
    callAt(calls, 0).resolve(spainResult);
    await first;

    controller.abort();

    await expect(cachedSearch('spain', freshSignal())).resolves.toEqual(spainResult);
    expect(calls).toHaveLength(1);
  });
});
