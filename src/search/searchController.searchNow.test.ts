import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spain } from '../api/__fixtures__/spain.js';
import { createSearchController } from './searchController.js';
import type { SearchState } from './searchController.js';

const DEBOUNCE_MS = 300;
const TIMEOUT_MS = 10_000;
const SPAIN_URL = 'https://countries.dev/name/spain';

function fakeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: () => Promise.resolve(body),
  } as Response;
}

describe('search controller: searchNow', () => {
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
    return createSearchController({ debounceMs: DEBOUNCE_MS, timeoutMs: TIMEOUT_MS });
  }

  async function flush(): Promise<void> {
    await vi.advanceTimersByTimeAsync(0);
  }

  function requestedUrls(): unknown[] {
    return fetchMock.mock.calls.map(([url]) => url);
  }

  it('sends the request immediately, without waiting for the debounce delay', () => {
    const controller = createController();

    controller.searchNow('spain');

    expect(requestedUrls()).toEqual([SPAIN_URL]);
  });

  it('shows the loading state right away', () => {
    const controller = createController();

    controller.searchNow('spain');

    expect(controller.getState()).toEqual({ status: 'loading', query: 'spain' });
  });

  it('switches to success when the response arrives', async () => {
    const controller = createController();

    controller.searchNow('spain');
    await flush();

    expect(controller.getState()).toMatchObject({
      status: 'success',
      query: 'spain',
      countries: [{ code: 'ESP' }],
    });
  });

  it('trims the query before searching', () => {
    const controller = createController();

    controller.searchNow('  spain  ');

    expect(requestedUrls()).toEqual([SPAIN_URL]);
  });

  it('does not send a second request when a debounced call was pending', async () => {
    const controller = createController();

    controller.setQuery('sp');
    controller.searchNow('spain');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 2);

    expect(requestedUrls()).toEqual([SPAIN_URL]);
  });

  it('aborts the request that is already in flight', async () => {
    const signals: AbortSignal[] = [];
    fetchMock.mockImplementation((_input, init) => {
      const signal = init?.signal;

      if (!signal) {
        return Promise.reject(new Error('fetch was called without a signal'));
      }

      signals.push(signal);

      return new Promise<Response>((_resolve, reject) => {
        signal.addEventListener(
          'abort',
          () => {
            reject(signal.reason);
          },
          { once: true },
        );
      });
    });
    const controller = createController();

    controller.setQuery('sp');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
    controller.searchNow('spain');
    await flush();

    expect(signals).toHaveLength(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
    expect(controller.getState()).toEqual({ status: 'loading', query: 'spain' });
  });

  it('acts like clearing the input for a blank query, even if a debounced call was pending', async () => {
    const controller = createController();

    controller.setQuery('spain');
    controller.searchNow('   ');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS * 2);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(controller.getState()).toEqual({ status: 'idle' });
  });

  it('makes retry repeat the query given to searchNow', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    const controller = createController();

    controller.searchNow('spain');
    await flush();
    expect(controller.getState()).toEqual({ status: 'error', query: 'spain', kind: 'network' });

    controller.retry();
    await flush();

    expect(requestedUrls()).toEqual([SPAIN_URL, SPAIN_URL]);
    expect(controller.getState()).toMatchObject({ status: 'success', query: 'spain' });
  });

  it('notifies subscribers about loading and then success', async () => {
    const controller = createController();
    const statuses: SearchState['status'][] = [];
    controller.subscribe((state) => {
      statuses.push(state.status);
    });

    controller.searchNow('spain');
    await flush();

    expect(statuses).toEqual(['loading', 'success']);
  });
});
