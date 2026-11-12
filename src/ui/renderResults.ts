import type { Country } from '../api/types.js';
import type { SearchState } from '../search/searchController.js';
import { el } from './dom.js';
import { renderCountryCard } from './renderCountryCard.js';

export function renderResults(
  container: HTMLElement,
  state: SearchState,
  onSelect: (country: Country) => void,
): void {
  if (state.status === 'success') {
    const cards = state.countries.map((country) => renderCountryCard(country, onSelect));
    container.replaceChildren(el('ul', { className: 'country-list' }, cards));
    return;
  }
  container.textContent = state.status;
}
