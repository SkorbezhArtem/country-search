import type { Country } from '../api/types.js';
import type { SearchErrorKind } from './classifyError.js';

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

export function createSearchController(options: SearchControllerOptions): SearchController {
  void options;
  throw new Error('not implemented');
}
