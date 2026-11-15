import type { SearchController } from '../search/searchController.js';
import type { SearchHistory } from '../search/searchHistory.js';
import { el } from './dom.js';
import { createCountryDialog } from './renderCountryDialog.js';
import { renderResults } from './renderResults.js';
import type { ResultsHandlers } from './renderResults.js';
import { getResultsSummary } from './resultsSummary.js';

export interface AppServices {
  controller: SearchController;
  history: SearchHistory;
  themeSwitcher: HTMLElement;
}

export function mountApp(
  root: HTMLElement,
  { controller, history, themeSwitcher }: AppServices,
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
  const summary = el('p', { className: 'results__summary', attrs: { role: 'status' } });
  const content = el('div', { className: 'results__content' });
  const results = el('main', { className: 'results' }, [summary, content]);
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
    const state = controller.getState();

    renderResults(content, state, handlers);
    summary.textContent = getResultsSummary(state);
  }

  input.addEventListener('input', () => {
    controller.setQuery(input.value);
  });

  controller.subscribe(render);

  root.append(
    el('header', { className: 'header' }, [
      el('div', { className: 'header__top' }, [
        el('h1', { className: 'header__title' }, [
          el('img', {
            className: 'header__logo',
            attrs: { src: 'favicon.svg', alt: '', width: '40', height: '40' },
          }),
          'Country Search',
        ]),
        themeSwitcher,
      ]),
      input,
    ]),
    results,
    detailsDialog.element,
  );

  render();
}
