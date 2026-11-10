import type { Country } from './types.js';

export async function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
  void query;
  void signal;
  throw new Error('not implemented');
}
