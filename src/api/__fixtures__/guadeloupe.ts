import type { RawCountry } from '../types.js';

// Real countries.dev response: no area, no borders.
export const guadeloupe: RawCountry = {
  flag: '🇬🇵',
  name: 'Guadeloupe',
  flags: {
    png: 'https://flagcdn.com/w320/gp.png',
    svg: 'https://flagcdn.com/gp.svg',
  },
  latlng: [16.25, -61.583333],
  region: 'Americas',
  capital: 'Basse-Terre',
  demonym: 'Guadeloupian',
  languages: [{ name: 'French', iso639_1: 'fr', iso639_2: 'fra', nativeName: 'français' }],
  subregion: 'Caribbean',
  timezones: ['UTC-04:00'],
  alpha2Code: 'GP',
  alpha3Code: 'GLP',
  currencies: [{ code: 'EUR', name: 'Euro', symbol: '€' }],
  nativeName: 'Guadeloupe',
  population: 400132,
  independent: false,
  numericCode: '312',
  callingCodes: ['590'],
  topLevelDomain: ['.gp'],
};
