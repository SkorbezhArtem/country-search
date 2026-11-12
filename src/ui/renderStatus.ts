import type { SearchState } from '../search/searchController.js';
import { el } from './dom.js';

type ErrorKind = Extract<SearchState, { status: 'error' }>['kind'];

const ERROR_MESSAGES: Record<ErrorKind, string> = {
  timeout: 'The server took too long to respond.',
  http: 'The server returned an error.',
  network: 'Could not reach the server. Check your connection.',
  unknown: 'Something unexpected happened.',
};

export function renderLoading(): HTMLElement {
  return el('div', { className: 'status status--loading', attrs: { role: 'status' } }, [
    el('span', { className: 'status__spinner', attrs: { 'aria-hidden': 'true' } }),
    el('p', { className: 'status__text', text: 'Searching…' }),
  ]);
}

export function renderEmpty(query: string): HTMLElement {
  return el('div', { className: 'status status--empty', attrs: { role: 'status' } }, [
    el('p', { className: 'status__title', text: 'Nothing found' }),
    el('p', {
      className: 'status__text',
      text: `No countries match "${query}". Try another spelling or the English name.`,
    }),
  ]);
}

export function renderError(kind: ErrorKind): HTMLElement {
  return el('div', { className: 'status status--error', attrs: { role: 'alert' } }, [
    el('p', { className: 'status__title', text: 'Search failed' }),
    el('p', { className: 'status__text', text: ERROR_MESSAGES[kind] }),
  ]);
}
