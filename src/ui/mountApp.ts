import type { SearchController } from '../search/searchController.js';
import { el } from './dom.js';
import { renderResults } from './renderResults.js';
import type { ResultsHandlers } from './renderResults.js';
import { createCountryDialog } from './renderCountryDialog.js';

export function mountApp(root: HTMLElement, controller: SearchController): void {
  const input = el('input', {
    className: 'search__input',
    attrs: {
      type: 'search',
      placeholder: 'Search a country…',
      'aria-label': 'Country name',
      autocomplete: 'off',
    },
  });
  const results = el('main', { className: 'results' });

  input.addEventListener('input', () => {
    controller.setQuery(input.value);
  });

  const detailsDialog = createCountryDialog();

  const handlers: ResultsHandlers = {
    onSelect: (country) => {
      detailsDialog.open(country);
    },
    onRetry: () => {
      controller.retry();
    },
  };

  controller.subscribe((state) => {
    renderResults(results, state, handlers);
  });

  root.append(
    el('header', { className: 'header' }, [
      el('h1', { className: 'header__title', text: 'Country Search' }),
      input,
    ]),
    results,
    detailsDialog.element,
  );
}
