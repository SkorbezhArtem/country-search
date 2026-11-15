import { HttpError } from './HttpError.js';
import { mapCountryResponse } from './mapCountryResponse.js';
import type { Country, RawCountry } from './types.js';

const COUNTRIES_API_URL = 'https://countries.dev/name';

export async function searchCountries(query: string, signal: AbortSignal): Promise<Country[]> {
  const response = await fetch(`${COUNTRIES_API_URL}/${encodeURIComponent(query)}`, { signal });

  if (response.status === 404) {
    return [];
  }

  if (!response.ok) {
    throw new HttpError(response.status, response.statusText);
  }

  const raw: RawCountry[] = await response.json();

  return mapCountryResponse(raw);
}
