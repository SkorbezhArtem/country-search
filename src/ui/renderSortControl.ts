import { SORT_ORDERS } from '../search/sortCountries.js';
import type { SortOrder } from '../search/sortCountries.js';
import { el } from './dom.js';

const SELECT_ID = 'sort-order';

const SORT_LABELS: Record<SortOrder, string> = {
  relevance: 'Best match',
  name: 'Name (A–Z)',
  population: 'Population (high to low)',
  area: 'Area (large to small)',
};

export interface SortControl {
  element: HTMLElement;
  setVisible(visible: boolean): void;
}

export function renderSortControl(
  initial: SortOrder,
  onChange: (order: SortOrder) => void,
): SortControl {
  const options = SORT_ORDERS.map((order) => {
    const option = el('option', { text: SORT_LABELS[order], attrs: { value: order } });

    option.selected = order === initial;

    return option;
  });

  const select = el('select', { className: 'sort__select', attrs: { id: SELECT_ID } }, options);

  select.addEventListener('change', () => {
    const order = SORT_ORDERS.find((candidate) => candidate === select.value);

    if (order) {
      onChange(order);
    }
  });

  const element = el('div', { className: 'sort' }, [
    el('label', { className: 'sort__label', text: 'Sort', attrs: { for: SELECT_ID } }),
    select,
  ]);

  return {
    element,
    setVisible(visible) {
      element.hidden = !visible;
    },
  };
}
