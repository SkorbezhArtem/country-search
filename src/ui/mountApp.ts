import type { SearchController } from '../search/searchController.js';
import type { SearchHistory } from '../search/searchHistory.js';
import { el } from './dom.js';
import { createCountryDialog } from './renderCountryDialog.js';
import { renderResults } from './renderResults.js';
import type { ResultsHandlers } from './renderResults.js';

export function mountApp(
  root: HTMLElement,
  controller: SearchController,
  history: SearchHistory,
): void {
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
  const detailsDialog = createCountryDialog();

  const handlers: ResultsHandlers = {
    onSelect: (country) => {
      detailsDialog.open(country);
    },
    onRetry: () => {
      controller.retry();
    },
    getHistory: () => history.getAll(),
    onHistorySelect: (query) => {
      input.value = query;
      controller.searchNow(query);
    },
    onHistoryClear: () => {
      history.clear();
      render();
    },
  };

  function render(): void {
    renderResults(results, controller.getState(), handlers);
  }

  input.addEventListener('input', () => {
    controller.setQuery(input.value);
  });

  controller.subscribe(render);

  root.append(
    el('header', { className: 'header' }, [
      el('h1', { className: 'header__title', text: 'Country Search' }),
      input,
    ]),
    results,
    detailsDialog.element,
  );

  render();
}
