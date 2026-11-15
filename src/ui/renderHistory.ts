import { el } from './dom.js';

export interface HistoryHandlers {
  onSelect: (query: string) => void;
  onClear: () => void;
}

export function renderHistory(entries: string[], handlers: HistoryHandlers): HTMLElement {
  const clearButton = el('button', {
    className: 'history__clear',
    text: 'Clear',
    attrs: { type: 'button' },
  });

  clearButton.addEventListener('click', () => {
    handlers.onClear();
  });

  const items = entries.map((query) => {
    const button = el('button', {
      className: 'history__item',
      text: query,
      attrs: { type: 'button' },
    });

    button.addEventListener('click', () => {
      handlers.onSelect(query);
    });

    return el('li', { className: 'history__entry' }, [button]);
  });

  return el('section', { className: 'history', attrs: { 'aria-labelledby': 'history-title' } }, [
    el('div', { className: 'history__header' }, [
      el('h2', {
        className: 'history__title',
        text: 'Recent searches',
        attrs: { id: 'history-title' },
      }),
      clearButton,
    ]),
    el('ul', { className: 'history__list' }, items),
  ]);
}
