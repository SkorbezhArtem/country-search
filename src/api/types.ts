export interface RawFlags {
  png: string;
  svg: string;
}

export interface RawLanguage {
  name: string;
  iso639_1?: string;
  iso639_2?: string;
  nativeName?: string;
}

export interface RawCurrency {
  code: string;
  name: string;
  symbol?: string;
}

export interface RawCountry {
  name: string;
  nativeName?: string;
  alpha2Code: string;
  alpha3Code: string;
  numericCode?: string;
  cioc?: string;
  flag: string;
  flags: RawFlags;
  capital?: string;
  region: string;
  subregion?: string;
  population: number;
  area?: number;
  gini?: number;
  latlng?: number[];
  borders?: string[];
  demonym?: string;
  languages?: RawLanguage[];
  currencies?: RawCurrency[];
  timezones?: string[];
  callingCodes?: string[];
  topLevelDomain?: string[];
  independent?: boolean;
  populationDensity?: number;
}

export interface Currency {
  code: string;
  name: string;
  symbol: string | null;
}

export interface Country {
  code: string;
  name: string;
  nativeName: string | null;
  flagEmoji: string;
  flagUrl: string;
  capital: string | null;
  region: string;
  subregion: string | null;
  population: number;
  area: number | null;
  borders: string[];
  demonym: string | null;
  languages: string[];
  currencies: Currency[];
}
