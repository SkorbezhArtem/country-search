import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spain } from '../api/__fixtures__/spain.js';
import { searchCountries } from '../api/searchCountries.js';
import { createCachedSearch } from './createCachedSearch.js';
import { createSearchController } from './searchController.js';

const DEBOUNCE_MS = 300;
const TIMEOUT_MS = 10_000;

function fakeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: () => Promise.resolve(body),
  } as Response;
}

describe('search controller with cached search', () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => Promise.resolve(fakeResponse(200, [spain])));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function createController() {
    return createSearchController({
      debounceMs: DEBOUNCE_MS,
      timeoutMs: TIMEOUT_MS,
      search: createCachedSearch(searchCountries),
    });
  }

  it('does not request the network again when the same query is typed twice', async () => {
    const controller = createController();

    controller.setQuery('spain');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    controller.setQuery('');
    controller.setQuery('spain');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(controller.getState()).toMatchObject({ status: 'success', query: 'spain' });
  });

  it('requests the network again on retry after a failure', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const controller = createController();

    controller.setQuery('spain');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    expect(controller.getState()).toEqual({ status: 'error', query: 'spain', kind: 'network' });

    controller.retry();
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(controller.getState()).toMatchObject({ status: 'success', query: 'spain' });
  });
});
