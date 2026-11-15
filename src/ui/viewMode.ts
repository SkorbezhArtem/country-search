export type ViewMode = 'cards' | 'list';

export const VIEW_MODES: readonly ViewMode[] = ['cards', 'list'];

export type ViewModeStorage = Pick<Storage, 'getItem' | 'setItem'>;

const STORAGE_KEY = 'country-search:view';
const DEFAULT_VIEW_MODE: ViewMode = 'cards';

function isViewMode(value: unknown): value is ViewMode {
  return VIEW_MODES.some((mode) => mode === value);
}

export function loadViewMode(storage: ViewModeStorage): ViewMode {
  try {
    const stored = storage.getItem(STORAGE_KEY);

    return isViewMode(stored) ? stored : DEFAULT_VIEW_MODE;
  } catch {
    return DEFAULT_VIEW_MODE;
  }
}

export function saveViewMode(storage: ViewModeStorage, mode: ViewMode): void {
  try {
    storage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage is blocked: the choice lasts only until the page is closed.
  }
}
