import type { SearchState } from '../search/searchController.js';
import { formatNumber } from './format.js';

export function getResultsSummary(state: SearchState): string {
  if (state.status !== 'success') {
    return '';
  }

  const count = state.countries.length;

  return count === 1 ? '1 country found' : `${formatNumber(count)} countries found`;
}
