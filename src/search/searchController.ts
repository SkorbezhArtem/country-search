import { searchCountries } from '../api/searchCountries.js';
import type { Country } from '../api/types.js';
import { debounce } from '../lib/debounce.js';
import { classifyError } from './classifyError.js';
import type { SearchErrorKind } from './classifyError.js';
import { createRequestSignal } from './createRequestSignal.js';

export type SearchState =
  | { status: 'idle' }
  | { status: 'loading'; query: string }
  | { status: 'success'; query: string; countries: Country[] }
  | { status: 'empty'; query: string }
  | { status: 'error'; query: string; kind: Exclude<SearchErrorKind, 'aborted'> };

export type SearchListener = (state: SearchState) => void;

export interface SearchControllerOptions {
  debounceMs: number;
  timeoutMs: number;
}

export interface SearchController {
  setQuery(query: string): void;
  retry(): void;
  getState(): SearchState;
  subscribe(listener: SearchListener): () => void;
}

export function createSearchController({
  debounceMs,
  timeoutMs,
}: SearchControllerOptions): SearchController {
  const listeners = new Set<SearchListener>();
  let state: SearchState = { status: 'idle' };
  let lastQuery = '';
  let activeRequest: AbortController | undefined;

  function setState(next: SearchState): void {
    state = next;
    for (const listener of listeners) {
      listener(next);
    }
  }

  function abortActiveRequest(): void {
    activeRequest?.abort();
    activeRequest = undefined;
  }

  async function search(query: string): Promise<void> {
    abortActiveRequest();

    const request = new AbortController();
    activeRequest = request;
    const signal = createRequestSignal(request.signal, timeoutMs);

    try {
      const countries = await searchCountries(query, signal);

      if (request.signal.aborted) {
        return;
      }

      setState(
        countries.length > 0 ? { status: 'success', query, countries } : { status: 'empty', query },
      );
    } catch (error) {
      const kind = classifyError(error);

      if (kind === 'aborted' || request.signal.aborted) {
        return;
      }

      setState({ status: 'error', query, kind });
    } finally {
      if (activeRequest === request) {
        activeRequest = undefined;
      }
    }
  }

  const searchLastQuery = debounce(() => {
    if (lastQuery !== '') {
      void search(lastQuery);
    }
  }, debounceMs);

  return {
    setQuery(text) {
      abortActiveRequest();
      lastQuery = text.trim();

      if (lastQuery === '') {
        setState({ status: 'idle' });
        return;
      }

      setState({ status: 'loading', query: lastQuery });
      searchLastQuery();
    },

    retry() {
      if (lastQuery === '') {
        return;
      }

      setState({ status: 'loading', query: lastQuery });
      void search(lastQuery);
    },

    getState() {
      return state;
    },

    subscribe(listener) {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
  };
}
