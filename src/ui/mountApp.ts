import type { SearchController, SearchState } from '../search/searchController.js';
import type { SearchHistory } from '../search/searchHistory.js';
import { sortCountries } from '../search/sortCountries.js';
import type { SortOrder } from '../search/sortCountries.js';
import { el } from './dom.js';
import { createCountryDialog } from './renderCountryDialog.js';
import { renderResults } from './renderResults.js';
import type { ResultsHandlers } from './renderResults.js';
import { renderSortControl } from './renderSortControl.js';
import { getResultsSummary } from './resultsSummary.js';

export interface AppServices {
  controller: SearchController;
  history: SearchHistory;
  themeSwitcher: HTMLElement;
}

function applySort(state: SearchState, order: SortOrder): SearchState {
  return state.status === 'success'
    ? { ...state, countries: sortCountries(state.countries, order) }
    : state;
}

export function mountApp(
  root: HTMLElement,
  { controller, history, themeSwitcher }: AppServices,
): void {
  let sortOrder: SortOrder = 'relevance';

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
  const sortControl = renderSortControl(sortOrder, (order) => {
    sortOrder = order;
    render();
  });
  const toolbar = el('div', { className: 'results__toolbar' }, [summary, sortControl.element]);
  const content = el('div', { className: 'results__content' });
  const results = el('main', { className: 'results' }, [toolbar, content]);
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
    const summaryText = getResultsSummary(state);

    renderResults(content, applySort(state, sortOrder), handlers);
    summary.textContent = summaryText;
    sortControl.setVisible(state.status === 'success' && state.countries.length > 1);
    toolbar.hidden = summaryText === '';
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
