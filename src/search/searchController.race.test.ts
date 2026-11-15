import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { antarctica } from '../api/__fixtures__/antarctica.js';
import { spain } from '../api/__fixtures__/spain.js';
import { createSearchController } from './searchController.js';
import type { SearchController, SearchState } from './searchController.js';

const DEBOUNCE_MS = 300;
const TIMEOUT_MS = 10_000;

interface PendingRequest {
  url: string;
  signal: AbortSignal;
  respond(body: unknown): void;
}

function fakeResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: '',
    json: () => Promise.resolve(body),
  } as Response;
}

// Every call is parked in `pending` until the test answers it.
// Like the real fetch, it rejects with the abort reason when the signal aborts first.
function createAbortAwareFetch(pending: PendingRequest[]): typeof fetch {
  return (input, init) =>
    new Promise<Response>((resolve, reject) => {
      const signal = init?.signal;

      if (!signal) {
        reject(new Error('fetch was called without a signal'));
        return;
      }

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

      pending.push({
        url: String(input),
        signal,
        respond: (body) => {
          resolve(fakeResponse(200, body));
        },
      });
    });
}

describe('search controller: stale responses', () => {
  let pending: PendingRequest[];

  beforeEach(() => {
    vi.useFakeTimers();
    pending = [];
    vi.stubGlobal('fetch', createAbortAwareFetch(pending));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  function createController(): SearchController {
    return createSearchController({ debounceMs: DEBOUNCE_MS, timeoutMs: TIMEOUT_MS });
  }

  async function typeAndWait(controller: SearchController, text: string): Promise<void> {
    controller.setQuery(text);
    await vi.advanceTimersByTimeAsync(DEBOUNCE_MS);
  }

  async function flush(): Promise<void> {
    await vi.advanceTimersByTimeAsync(0);
  }

  function requestAt(index: number): PendingRequest {
    const request = pending[index];

    if (!request) {
      throw new Error(`request #${index} was not sent`);
    }

    return request;
  }

  it('shows only the latest result when an earlier response arrives later', async () => {
    const controller = createController();
    const states: SearchState[] = [];
    controller.subscribe((state) => {
      states.push(state);
    });

    await typeAndWait(controller, 'sp');
    await typeAndWait(controller, 'spain');
    expect(pending.map((request) => request.url)).toEqual([
      'https://countries.dev/name/sp',
      'https://countries.dev/name/spain',
    ]);

    requestAt(1).respond([spain]);
    await flush();
    requestAt(0).respond([antarctica]);
    await flush();

    expect(controller.getState()).toMatchObject({
      status: 'success',
      query: 'spain',
      countries: [{ code: 'ESP' }],
    });
    expect(states.some((state) => state.status === 'error')).toBe(false);
  });

  it('aborts the previous request as soon as the input changes, before the debounce delay', async () => {
    const controller = createController();
    await typeAndWait(controller, 'sp');
    const first = requestAt(0);

    controller.setQuery('spa');

    expect(first.signal.aborted).toBe(true);
    expect(first.signal.reason.name).toBe('AbortError');
    expect(pending).toHaveLength(1);
  });

  it('ignores a response that arrives while the new input waits for the debounce delay', async () => {
    const controller = createController();
    await typeAndWait(controller, 'sp');

    controller.setQuery('spa');
    requestAt(0).respond([antarctica]);
    await flush();

    expect(controller.getState()).toEqual({ status: 'loading', query: 'spa' });
  });

  it('aborts the in-flight request when the input is cleared and keeps the idle state', async () => {
    const controller = createController();
    await typeAndWait(controller, 'spain');
    const request = requestAt(0);

    controller.setQuery('');
    request.respond([spain]);
    await flush();

    expect(request.signal.aborted).toBe(true);
    expect(controller.getState()).toEqual({ status: 'idle' });
  });

  it('does not show the cancellation of its own request as an error', async () => {
    const controller = createController();
    await typeAndWait(controller, 'sp');

    controller.setQuery('spa');
    await flush();

    expect(controller.getState()).toEqual({ status: 'loading', query: 'spa' });
  });
});
