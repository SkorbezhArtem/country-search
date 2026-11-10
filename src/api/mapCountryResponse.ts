import type { Country, Currency, RawCountry, RawCurrency } from './types.js';

function mapCurrency(raw: RawCurrency): Currency {
  return {
    code: raw.code,
    name: raw.name,
    symbol: raw.symbol ?? null,
  };
}

function mapCountry(raw: RawCountry): Country {
  return {
    code: raw.alpha3Code,
    name: raw.name,
    nativeName: raw.nativeName ?? null,
    flagEmoji: raw.flag,
    flagUrl: raw.flags.svg,
    capital: raw.capital ?? null,
    region: raw.region,
    subregion: raw.subregion ?? null,
    population: raw.population,
    area: raw.area ?? null,
    borders: [...(raw.borders ?? [])],
    demonym: raw.demonym ?? null,
    languages: (raw.languages ?? []).map((language) => language.name),
    currencies: (raw.currencies ?? []).map(mapCurrency),
  };
}

export function mapCountryResponse(raw: RawCountry[]): Country[] {
  return raw.map(mapCountry);
}
