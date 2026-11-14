export type ThemePreference = 'system' | 'light' | 'dark';

export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

export type ThemeStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'country-search:theme';

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.some((preference) => preference === value);
}

export function loadThemePreference(storage: ThemeStorage): ThemePreference {
  try {
    const stored = storage.getItem(STORAGE_KEY);

    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function saveThemePreference(storage: ThemeStorage, preference: ThemePreference): void {
  try {
    storage.setItem(STORAGE_KEY, preference);
  } catch {
    // Storage is blocked: the choice lasts only until the page is closed.
  }
}

function setTheme(root: HTMLElement, preference: ThemePreference): void {
  if (preference === 'system') {
    root.removeAttribute('data-theme');
    return;
  }

  root.dataset.theme = preference;
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function applyThemePreference(
  root: HTMLElement,
  preference: ThemePreference,
  animate = false,
): void {
  if (!animate || prefersReducedMotion() || typeof document.startViewTransition !== 'function') {
    setTheme(root, preference);
    return;
  }

  root.setAttribute('data-theme-switching', '');

  const transition = document.startViewTransition(() => {
    setTheme(root, preference);
  });
  const cleanUp = (): void => {
    root.removeAttribute('data-theme-switching');
  };

  void transition.ready.catch(() => undefined);
  void transition.finished.then(cleanUp, cleanUp);
}
