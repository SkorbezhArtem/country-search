import { describe, expect, it } from 'vitest';
import { antarctica } from './__fixtures__/antarctica.js';
import { guadeloupe } from './__fixtures__/guadeloupe.js';
import { spain } from './__fixtures__/spain.js';
import { mapCountryResponse } from './mapCountryResponse.js';
import type { Country } from './types.js';

describe('mapCountryResponse', () => {
  it('maps a complete country to the app model', () => {
    const expected: Country = {
      code: 'ESP',
      name: 'Spain',
      nativeName: 'España',
      flagEmoji: '🇪🇸',
      flagUrl: 'https://flagcdn.com/es.svg',
      capital: 'Madrid',
      region: 'Europe',
      subregion: 'Southern Europe',
      population: 47351567,
      area: 505992,
      borders: ['AND', 'FRA', 'GIB', 'PRT', 'MAR'],
      demonym: 'Spanish',
      languages: ['Spanish'],
      currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
    };

    expect(mapCountryResponse([spain])).toEqual([expected]);
  });

  it('returns an empty array for an empty response', () => {
    expect(mapCountryResponse([])).toEqual([]);
  });

  it('uses null when the capital is missing', () => {
    const [country] = mapCountryResponse([antarctica]);

    expect(country?.capital).toBeNull();
  });

  it('uses an empty array when borders are missing', () => {
    const [country] = mapCountryResponse([antarctica]);

    expect(country?.borders).toEqual([]);
  });

  it('uses an empty array when currencies are missing', () => {
    const [country] = mapCountryResponse([antarctica]);

    expect(country?.currencies).toEqual([]);
  });

  it('uses null when the area is missing', () => {
    const [country] = mapCountryResponse([guadeloupe]);

    expect(country?.area).toBeNull();
  });

  it('maps all languages to their names keeping the order', () => {
    const [country] = mapCountryResponse([antarctica]);

    expect(country?.languages).toEqual(['English', 'Russian']);
  });

  it('uses null for missing native name, subregion and demonym', () => {
    const incomplete = {
      ...spain,
      nativeName: undefined,
      subregion: undefined,
      demonym: undefined,
    };

    const [country] = mapCountryResponse([incomplete]);

    expect(country?.nativeName).toBeNull();
    expect(country?.subregion).toBeNull();
    expect(country?.demonym).toBeNull();
  });

  it('uses null when a currency has no symbol', () => {
    const noSymbol = { ...spain, currencies: [{ code: 'EUR', name: 'Euro' }] };

    const [country] = mapCountryResponse([noSymbol]);

    expect(country?.currencies).toEqual([{ code: 'EUR', name: 'Euro', symbol: null }]);
  });

  it('keeps the order of countries from the response', () => {
    const result = mapCountryResponse([spain, antarctica, guadeloupe]);

    expect(result.map((country) => country.name)).toEqual(['Spain', 'Antarctica', 'Guadeloupe']);
  });

  it('does not mutate the input', () => {
    const input = [structuredClone(spain), structuredClone(antarctica)];
    const snapshot = structuredClone(input);

    mapCountryResponse(input);

    expect(input).toEqual(snapshot);
  });
});
