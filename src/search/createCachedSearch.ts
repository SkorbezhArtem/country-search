import type { Country } from '../api/types.js';

export type SearchFn = (query: string, signal: AbortSignal) => Promise<Country[]>;

interface SharedRequest {
  controller: AbortController;
  promise: Promise<Country[]>;
  subscribers: number;
  settled: boolean;
}

export function createCachedSearch(search: SearchFn): SearchFn {
  const cache = new Map<string, Country[]>();
  const inFlight = new Map<string, SharedRequest>();

  function startRequest(query: string): SharedRequest {
    const controller = new AbortController();

    const promise = search(query, controller.signal)
      .then((countries) => {
        cache.set(query, countries);
        return countries;
      })
      .finally(() => {
        request.settled = true;

        if (inFlight.get(query) === request) {
          inFlight.delete(query);
        }
      });

    const request: SharedRequest = { controller, promise, subscribers: 0, settled: false };
    inFlight.set(query, request);

    return request;
  }

  function release(query: string, request: SharedRequest): void {
    request.subscribers -= 1;

    if (request.subscribers > 0 || request.settled) {
      return;
    }

    request.controller.abort();

    if (inFlight.get(query) === request) {
      inFlight.delete(query);
    }
  }

  function wait(query: string, request: SharedRequest, signal: AbortSignal): Promise<Country[]> {
    request.subscribers += 1;

    return new Promise<Country[]>((resolve, reject) => {
      const onAbort = (): void => {
        reject(signal.reason);
        release(query, request);
      };

      signal.addEventListener('abort', onAbort, { once: true });

      request.promise.then(resolve, reject).finally(() => {
        signal.removeEventListener('abort', onAbort);
      });
    });
  }

  return (query, signal) => {
    if (signal.aborted) {
      return Promise.reject(signal.reason);
    }

    const cached = cache.get(query);

    if (cached !== undefined) {
      return Promise.resolve(cached);
    }

    const request = inFlight.get(query) ?? startRequest(query);

    return wait(query, request, signal);
  };
}
