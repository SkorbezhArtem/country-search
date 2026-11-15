import { el } from './dom.js';

export const EXAMPLE_QUERIES: readonly string[] = ['Japan', 'Brazil', 'Iceland'];

export function renderInvite(
  examples: readonly string[],
  onSelect: (query: string) => void,
): HTMLElement {
  const items = examples.map((query) => {
    const button = el('button', {
      className: 'invite__example',
      text: query,
      attrs: { type: 'button' },
    });

    button.addEventListener('click', () => {
      onSelect(query);
    });

    return el('li', {}, [button]);
  });

  return el('section', { className: 'invite' }, [
    el('img', {
      className: 'invite__logo',
      attrs: { src: 'favicon.svg', alt: '', width: '48', height: '48' },
    }),
    el('h2', { className: 'invite__title', text: 'Find a country' }),
    el('p', {
      className: 'invite__text',
      text: 'Type a name in English, or try one of these:',
    }),
    el('ul', { className: 'invite__examples' }, items),
  ]);
}
