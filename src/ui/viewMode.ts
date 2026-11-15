export type ViewMode = 'cards' | 'list';

export const VIEW_MODES: readonly ViewMode[] = ['cards', 'list'];

export type ViewModeStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function loadViewMode(storage: ViewModeStorage): ViewMode {
  void storage;
  throw new Error('not implemented');
}

export function saveViewMode(storage: ViewModeStorage, mode: ViewMode): void {
  void storage;
  void mode;
  throw new Error('not implemented');
}
