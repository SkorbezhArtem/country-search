import { searchCountries } from './api/searchCountries.js';
import { createCachedSearch } from './search/createCachedSearch.js';
import { createSearchController } from './search/searchController.js';
import { createSearchHistory } from './search/searchHistory.js';
import type { HistoryStorage } from './search/searchHistory.js';
import { mountApp } from './ui/mountApp.js';
import { renderThemeSwitcher } from './ui/renderThemeSwitcher.js';
import { applyThemePreference, loadThemePreference, saveThemePreference } from './ui/theme.js';

const DEBOUNCE_MS = 300;
const REQUEST_TIMEOUT_MS = 8000;

const storage: HistoryStorage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => {
    localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    localStorage.removeItem(key);
  },
};

const themePreference = loadThemePreference(storage);
applyThemePreference(document.documentElement, themePreference);

const controller = createSearchController({
  debounceMs: DEBOUNCE_MS,
  timeoutMs: REQUEST_TIMEOUT_MS,
  search: createCachedSearch(searchCountries),
});

const history = createSearchHistory(storage);

controller.subscribe((state) => {
  if (state.status === 'success') {
    history.add(state.query);
  }
});

const themeSwitcher = renderThemeSwitcher(themePreference, (next) => {
  applyThemePreference(document.documentElement, next, true);
  saveThemePreference(storage, next);
});

mountApp(document.body, { controller, history, themeSwitcher });
