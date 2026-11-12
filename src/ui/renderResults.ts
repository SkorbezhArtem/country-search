import type { Country } from '../api/types.js';
import type { SearchState } from '../search/searchController.js';
import { el } from './dom.js';
import { renderCountryCard } from './renderCountryCard.js';
import { renderEmpty, renderError, renderLoading } from './renderStatus.js';

export function renderResults(
  container: HTMLElement,
  state: SearchState,
  onSelect: (country: Country) => void,
): void {
  switch (state.status) {
    case 'idle':
      container.replaceChildren();
      return;

    case 'loading':
      container.replaceChildren(renderLoading());
      return;

    case 'success': {
      const cards = state.countries.map((country) => renderCountryCard(country, onSelect));
      container.replaceChildren(el('ul', { className: 'country-list' }, cards));
      return;
    }

    case 'empty':
      container.replaceChildren(renderEmpty(state.query));
      return;

    case 'error':
      container.replaceChildren(renderError(state.kind));
      return;
  }
}
