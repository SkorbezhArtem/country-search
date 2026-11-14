import type { Country } from '../api/types.js';

export type SearchFn = (query: string, signal: AbortSignal) => Promise<Country[]>;

export function createCachedSearch(search: SearchFn): SearchFn {
  void search;
  throw new Error('not implemented');
}
