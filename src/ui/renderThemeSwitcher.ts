import { el } from './dom.js';
import { renderIcon } from './icons.js';
import { THEME_PREFERENCES } from './theme.js';
import type { ThemePreference } from './theme.js';

const LABELS: Record<ThemePreference, string> = {
  system: 'System theme',
  light: 'Light theme',
  dark: 'Dark theme',
};

export function renderThemeSwitcher(
  initial: ThemePreference,
  onChange: (preference: ThemePreference) => void,
): HTMLElement {
  const group = el('div', {
    className: 'theme-switcher',
    attrs: { role: 'group', 'aria-label': 'Color theme' },
  });
  const thumb = el('span', {
    className: 'theme-switcher__thumb',
    attrs: { 'aria-hidden': 'true' },
  });

  const options = THEME_PREFERENCES.map((preference) => {
    const button = el(
      'button',
      {
        className: 'theme-switcher__option',
        attrs: { type: 'button', 'aria-label': LABELS[preference], title: LABELS[preference] },
      },
      [renderIcon(preference)],
    );

    button.addEventListener('click', () => {
      select(preference);
      onChange(preference);
    });

    return { preference, button };
  });

  function select(selected: ThemePreference): void {
    group.dataset.selected = selected;

    for (const { preference, button } of options) {
      button.setAttribute('aria-pressed', String(preference === selected));
    }
  }

  group.append(thumb, ...options.map(({ button }) => button));
  select(initial);

  return group;
}
