import { createSearchController } from './search/searchController.js';
import { mountApp } from './ui/mountApp.js';

const DEBOUNCE_MS = 300;
const REQUEST_TIMEOUT_MS = 8000;

const controller = createSearchController({
  debounceMs: DEBOUNCE_MS,
  timeoutMs: REQUEST_TIMEOUT_MS,
});

mountApp(document.body, controller);
