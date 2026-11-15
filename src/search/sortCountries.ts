import type { Country } from '../api/types.js';

export type SortOrder = 'relevance' | 'name' | 'population' | 'area';

export const SORT_ORDERS: readonly SortOrder[] = ['relevance', 'name', 'population', 'area'];

type Comparator = (a: Country, b: Country) => number;

const nameCollator = new Intl.Collator('en', { sensitivity: 'base' });

function compareByName(a: Country, b: Country): number {
  return nameCollator.compare(a.name, b.name);
}

function compareByPopulation(a: Country, b: Country): number {
  return b.population - a.population;
}

function compareByArea(a: Country, b: Country): number {
  if (a.area === b.area) {
    return 0;
  }

  if (a.area === null) {
    return 1;
  }

  if (b.area === null) {
    return -1;
  }

  return b.area - a.area;
}

const COMPARATORS: Record<Exclude<SortOrder, 'relevance'>, Comparator> = {
  name: compareByName,
  population: compareByPopulation,
  area: compareByArea,
};

export function sortCountries(countries: readonly Country[], order: SortOrder): Country[] {
  if (order === 'relevance') {
    return [...countries];
  }

  return countries.toSorted(COMPARATORS[order]);
}
