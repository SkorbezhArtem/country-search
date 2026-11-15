import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { antarctica } from '../api/__fixtures__/antarctica.js';
import { spain } from '../api/__fixtures__/spain.js';
import { createSearchController } from './searchController.js';
import type { SearchState } from './searchController.js';

const DEBOUNCE_MS = 300;
const TIMEOUT_MS = 10_000;
const SPAIN_URL = 'https://countries.dev/name/spain';

// A plain object instead of a real Response: reading a real body relies on stream
// internals that do not play well with fake timers.
function fakeResponse(status: number, body: unknown = null, statusText = ''): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: () => Promise.resolve(body),
  } as Response;
}

describe('createSearchController', () => {
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

  async function waitForDebounce(): Promise<void> {
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
  }

  function requestedUrls(): unknown[] {
    return fetchMock.mock.calls.map(([url]) => url);
  }

  it('starts in the idle state', () => {
    expect(createController().getState()).toEqual({ status: 'idle' });
  });

  it('shows the loading state right after the input changes', () => {
    const controller = createController();

    controller.setQuery('spain');

    expect(controller.getState()).toEqual({ status: 'loading', query: 'spain' });
  });

  it('does not send a request before the debounce delay elapses', async () => {
    const controller = createController();

    controller.setQuery('spain');
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS - 1);

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends one request when the debounce delay elapses', async () => {
    const controller = createController();

    controller.setQuery('spain');
    await waitForDebounce();

    expect(requestedUrls()).toEqual([SPAIN_URL]);
  });

  it('sends a single request for the final text of a burst of typing', async () => {
    const controller = createController();

    for (const text of ['s', 'sp', 'spa', 'spai', 'spain']) {
      controller.setQuery(text);
      await vi.advanceTimersByTimeAsync(50);
    }
    await waitForDebounce();

    expect(requestedUrls()).toEqual([SPAIN_URL]);
  });

  it('switches to success with mapped countries when the response arrives', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(fakeResponse(200, [spain, antarctica])));
    const controller = createController();

    controller.setQuery('a');
    await waitForDebounce();

    expect(controller.getState()).toMatchObject({
      status: 'success',
      query: 'a',
      countries: [{ code: 'ESP' }, { code: 'ATA' }],
    });
  });

  it('switches to empty, not to error, on 404', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(fakeResponse(404, null, 'Not Found')));
    const controller = createController();

    controller.setQuery('zzzzzz');
    await waitForDebounce();

    expect(controller.getState()).toEqual({ status: 'empty', query: 'zzzzzz' });
  });

  it('switches to an http error on a server failure', async () => {
    fetchMock.mockImplementation(() => Promise.resolve(fakeResponse(500, null, 'Server Error')));
    const controller = createController();

    controller.setQuery('spain');
    await waitForDebounce();

    expect(controller.getState()).toEqual({ status: 'error', query: 'spain', kind: 'http' });
  });

  it('switches to a network error when fetch fails', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const controller = createController();

    controller.setQuery('spain');
    await waitForDebounce();

    expect(controller.getState()).toEqual({ status: 'error', query: 'spain', kind: 'network' });
  });

  it('stays idle and sends no request for a blank input', async () => {
    const controller = createController();

    controller.setQuery('   ');
    await waitForDebounce();

    expect(controller.getState()).toEqual({ status: 'idle' });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('trims the query before searching', async () => {
    const controller = createController();

    controller.setQuery('  spain  ');
    await waitForDebounce();

    expect(requestedUrls()).toEqual([SPAIN_URL]);
    expect(controller.getState()).toMatchObject({ status: 'success', query: 'spain' });
  });

  it('returns to idle and drops the results when the input is cleared', async () => {
    const controller = createController();
    controller.setQuery('spain');
    await waitForDebounce();

    controller.setQuery('');

    expect(controller.getState()).toEqual({ status: 'idle' });
  });

  it('sends no request when the input is cleared during the debounce delay', async () => {
    const controller = createController();

    controller.setQuery('spain');
    await vi.advanceTimersByTimeAsync(100);
    controller.setQuery('');
    await waitForDebounce();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(controller.getState()).toEqual({ status: 'idle' });
  });

  it('retries the last query immediately, without waiting for the debounce delay', async () => {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(fakeResponse(500, null, 'Server Error')),
    );
    const controller = createController();
    controller.setQuery('spain');
    await waitForDebounce();
    expect(controller.getState()).toMatchObject({ status: 'error', kind: 'http' });

    controller.retry();

    expect(controller.getState()).toEqual({ status: 'loading', query: 'spain' });
    await vi.advanceTimersByTimeAsync(0);
    expect(requestedUrls()).toEqual([SPAIN_URL, SPAIN_URL]);
    expect(controller.getState()).toMatchObject({ status: 'success', query: 'spain' });
  });

  it('does nothing on retry when there was no query yet', async () => {
    const controller = createController();

    controller.retry();
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchMock).not.toHaveBeenCalled();
    expect(controller.getState()).toEqual({ status: 'idle' });
  });

  it('notifies subscribers about every state change until they unsubscribe', async () => {
    const controller = createController();
    const states: SearchState[] = [];
    const unsubscribe = controller.subscribe((state) => {
      states.push(state);
    });

    controller.setQuery('spain');
    await waitForDebounce();
    unsubscribe();
    controller.setQuery('');

    expect(states.map((state) => state.status)).toEqual(['loading', 'success']);
  });
});
