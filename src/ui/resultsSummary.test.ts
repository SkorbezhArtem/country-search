import { describe, expect, it } from 'vitest';
import { antarctica } from '../api/__fixtures__/antarctica.js';
import { guadeloupe } from '../api/__fixtures__/guadeloupe.js';
import { spain } from '../api/__fixtures__/spain.js';
import { mapCountryResponse } from '../api/mapCountryResponse.js';
import type { SearchState } from '../search/searchController.js';
import { getResultsSummary } from './resultsSummary.js';

const countries = mapCountryResponse([spain, antarctica, guadeloupe]);

function success(count: number): SearchState {
  return {
    status: 'success',
    query: 'a',
    countries: Array.from({ length: count }, (_, index) => countries[index % countries.length]!),
  };
}

describe('getResultsSummary', () => {
  it.each<[string, SearchState]>([
    ['idle', { status: 'idle' }],
    ['loading', { status: 'loading', query: 'spain' }],
    ['empty', { status: 'empty', query: 'zzzz' }],
    ['error', { status: 'error', query: 'spain', kind: 'network' }],
  ])('returns an empty string in the %s state', (_name, state) => {
    expect(getResultsSummary(state)).toBe('');
  });

  it('uses the singular form for one country', () => {
    expect(getResultsSummary(success(1))).toBe('1 country found');
  });

  it('uses the plural form for several countries', () => {
    expect(getResultsSummary(success(2))).toBe('2 countries found');
    expect(getResultsSummary(success(3))).toBe('3 countries found');
  });

  it('separates thousands like the rest of the interface', () => {
    expect(getResultsSummary(success(1234))).toBe('1,234 countries found');
  });
});
