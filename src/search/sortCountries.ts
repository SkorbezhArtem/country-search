import type { Country } from '../api/types.js';

export type SortOrder = 'relevance' | 'name' | 'population' | 'area';

export function sortCountries(countries: readonly Country[], order: SortOrder): Country[] {
  void countries;
  void order;
  throw new Error('not implemented');
}
