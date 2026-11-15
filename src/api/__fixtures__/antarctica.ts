import type { RawCountry } from '../types.js';

// Real countries.dev response: no capital, no borders, no currencies, two languages.
export const antarctica: RawCountry = {
  area: 14000000,
  flag: '🇦🇶',
  name: 'Antarctica',
  flags: {
    png: 'https://flagcdn.com/w320/aq.png',
    svg: 'https://flagcdn.com/aq.svg',
  },
  latlng: [-74.65, 4.48],
  region: 'Polar',
  demonym: 'Antarctic',
  languages: [
    { name: 'English', iso639_1: 'en', iso639_2: 'eng', nativeName: 'English' },
    { name: 'Russian', iso639_1: 'ru', iso639_2: 'rus', nativeName: 'Русский' },
  ],
  subregion: 'Antarctica',
  timezones: [
    'UTC-03:00',
    'UTC+03:00',
    'UTC+05:00',
    'UTC+06:00',
    'UTC+07:00',
    'UTC+08:00',
    'UTC+10:00',
    'UTC+12:00',
  ],
  alpha2Code: 'AQ',
  alpha3Code: 'ATA',
  nativeName: 'Antarctica',
  population: 1000,
  independent: false,
  numericCode: '010',
  callingCodes: ['672'],
  topLevelDomain: ['.aq'],
  populationDensity: 0,
};
