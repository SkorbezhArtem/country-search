import { el } from './dom.js';
import { renderIcon } from './icons.js';
import { VIEW_MODES } from './viewMode.js';
import type { ViewMode } from './viewMode.js';

const LABELS: Record<ViewMode, string> = {
  cards: 'Card view',
  list: 'List view',
};

export function renderViewSwitcher(
  initial: ViewMode,
  onChange: (mode: ViewMode) => void,
): HTMLElement {
  const group = el('div', {
    className: 'view-switcher',
    attrs: { role: 'group', 'aria-label': 'Results layout' },
  });
  const thumb = el('span', {
    className: 'view-switcher__thumb',
    attrs: { 'aria-hidden': 'true' },
  });

  const options = VIEW_MODES.map((mode) => {
    const button = el(
      'button',
      {
        className: 'view-switcher__option',
        attrs: { type: 'button', 'aria-label': LABELS[mode], title: LABELS[mode] },
      },
      [renderIcon(mode)],
    );

    button.addEventListener('click', () => {
      select(mode);
      onChange(mode);
    });

    return { mode, button };
  });

  function select(selected: ViewMode): void {
    group.dataset.selected = selected;

    for (const { mode, button } of options) {
      button.setAttribute('aria-pressed', String(mode === selected));
    }
  }

  group.append(thumb, ...options.map(({ button }) => button));
  select(initial);

  return group;
}
