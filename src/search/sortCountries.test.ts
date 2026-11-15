import { describe, expect, it } from 'vitest';
import { spain } from '../api/__fixtures__/spain.js';
import { mapCountryResponse } from '../api/mapCountryResponse.js';
import type { Country } from '../api/types.js';
import { sortCountries } from './sortCountries.js';
import type { SortOrder } from './sortCountries.js';

const ORDERS: SortOrder[] = ['relevance', 'name', 'population', 'area'];

const base = mapCountryResponse([spain]).at(0);

if (!base) {
  throw new Error('fixture is missing');
}

function makeCountry(overrides: Partial<Country>): Country {
  return Object.assign({}, base, overrides);
}

function names(countries: Country[]): string[] {
  return countries.map((country) => country.name);
}

describe('sortCountries', () => {
  it.each(ORDERS)('returns a new array for the "%s" order', (order) => {
    const input = [makeCountry({ name: 'Spain' })];

    expect(sortCountries(input, order)).not.toBe(input);
  });

  it.each(ORDERS)('returns an empty array for an empty list in the "%s" order', (order) => {
    expect(sortCountries([], order)).toEqual([]);
  });

  it.each(ORDERS)('does not change the input in the "%s" order', (order) => {
    const input = [
      makeCountry({ name: 'B', population: 1, area: 1 }),
      makeCountry({ name: 'A', population: 2, area: 2 }),
    ];

    sortCountries(input, order);

    expect(names(input)).toEqual(['B', 'A']);
  });

  it('keeps the order of the response for "relevance"', () => {
    const input = [
      makeCountry({ name: 'C', population: 1 }),
      makeCountry({ name: 'A', population: 3 }),
      makeCountry({ name: 'B', population: 2 }),
    ];

    expect(names(sortCountries(input, 'relevance'))).toEqual(['C', 'A', 'B']);
  });

  it('sorts by name from A to Z ignoring case', () => {
    const input = [
      makeCountry({ name: 'brazil' }),
      makeCountry({ name: 'Argentina' }),
      makeCountry({ name: 'chile' }),
    ];

    expect(names(sortCountries(input, 'name'))).toEqual(['Argentina', 'brazil', 'chile']);
  });

  it('puts accented letters next to their base letter when sorting by name', () => {
    const input = [
      makeCountry({ name: 'Zimbabwe' }),
      makeCountry({ name: 'Åland Islands' }),
      makeCountry({ name: 'Brazil' }),
    ];

    expect(names(sortCountries(input, 'name'))).toEqual(['Åland Islands', 'Brazil', 'Zimbabwe']);
  });

  it('sorts by population from the largest', () => {
    const input = [
      makeCountry({ name: 'Small', population: 10 }),
      makeCountry({ name: 'Large', population: 1000 }),
      makeCountry({ name: 'Medium', population: 100 }),
    ];

    expect(names(sortCountries(input, 'population'))).toEqual(['Large', 'Medium', 'Small']);
  });

  it('sorts by area from the largest and puts missing areas last', () => {
    const input = [
      makeCountry({ name: 'Unknown', area: null }),
      makeCountry({ name: 'Small', area: 10 }),
      makeCountry({ name: 'Large', area: 1000 }),
      makeCountry({ name: 'Another unknown', area: null }),
    ];

    expect(names(sortCountries(input, 'area'))).toEqual([
      'Large',
      'Small',
      'Unknown',
      'Another unknown',
    ]);
  });

  it('keeps the original order of countries that are equal for the chosen field', () => {
    const input = [
      makeCountry({ name: 'A', population: 5 }),
      makeCountry({ name: 'B', population: 5 }),
      makeCountry({ name: 'C', population: 9 }),
    ];

    expect(names(sortCountries(input, 'population'))).toEqual(['C', 'A', 'B']);
  });
});
