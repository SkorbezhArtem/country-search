# Design notes

## 1. Cancelling stale requests

**The problem.** If the user types `sp`, the server may answer slower than for the next query `spain`. Then the old answer arrives later and overwrites the correct result.

**How it works here.**

- `createSearchController` (`src/search/searchController.ts`) keeps one `AbortController` for the active request (`activeRequest`).
- `setQuery` is called on every input event. Its first action is `abortActiveRequest()`. So the old request is aborted immediately, not when the debounce timer fires. A response that arrives while we wait for the debounce can no longer reach the screen. Clearing the input aborts the request too.
- `search()` aborts the previous request again before it starts a new one. This covers the retry path.
- `searchNow` (used when the user clicks an item of the search history) cancels the pending debounce with `debounced.cancel()` and starts the search at once. Without the cancel, the old timer would fire later and start a duplicate request.
- The signal goes to `searchCountries(query, signal)` and then to `fetch(url, { signal })`. The browser cancels the network request itself (it is marked `canceled` in the Network tab) and the promise rejects with `AbortError`.
- `createRequestSignal` (`src/search/createRequestSignal.ts`) combines our signal with `AbortSignal.timeout(ms)` using `AbortSignal.any`. A user cancel rejects with `AbortError`, a timeout rejects with `TimeoutError`.
- `classifyError` (`src/search/classifyError.ts`) tells the cases apart by `error.name`. `aborted` is ignored silently. `timeout`, `http`, `network` and `unknown` become an error state with a Retry button.

**Why not just a flag like "is this the latest response?"**

- A flag only hides the stale result. The stale request still runs, uses the network and may load the server. `abort()` stops the work at the source.
- With a flag, every new code path has to remember to check it. With `abort()`, the stale promise rejects, so the code after `await` does not run at all.
- A flag needs extra bookkeeping (request ids or timestamps). One controller per request is simpler.

There is one more check after `await`: `if (request.signal.aborted) return;`. It covers only the tiny window between a response arriving and the abort being processed. It is a last line of defence, not the main mechanism.

**A known limit.** `abort()` closes the connection on our side, but the server may still finish processing a request it has already received. Cancelling saves the client's work and bandwidth, it does not guarantee that the server does nothing.

The race is covered by tests in `src/search/searchController.race.test.ts`. The `fetch` mock there reacts to `signal` and rejects with the abort reason, so the tests prove a real cancellation and not just an ignored response.

## 2. Debounce delay

`DEBOUNCE_MS = 300` in `src/main.ts`.

- **Without debounce:** every keystroke starts a request. Typing `spain` means five requests and four immediate cancels. Abort keeps the result correct, but not cheap: the requests are still started, the server may still handle them, and the interface flickers between states.
- **Too long (for example 1000 ms):** the app feels broken. The user stops typing and nothing happens for a full second.
- **300 ms:** most people type with pauses between keys that are shorter than this, so a burst of typing becomes one request. It fires on a natural pause, and it is still short enough to feel responsive.

Feedback does not wait for the delay: `setQuery` switches the state to `loading` immediately, only the network request is delayed.

`debounce` also has `cancel()`. It drops a pending call, so a direct search (`searchNow`) is never followed by a late duplicate.

The request timeout is `REQUEST_TIMEOUT_MS = 8000`. It is long enough for a slow connection and short enough that the user gets an error with a Retry button instead of waiting forever.

## 3. Complexity

### `mapCountryResponse`

`src/api/mapCountryResponse.ts` makes one pass over the response with `.map`.

- `n` is the number of countries, `l`, `c`, `b` are the numbers of languages, currencies and borders of one country.
- **Time:** `O(n · (l + c + b))`. There are no nested loops over `n`. In real data `l`, `c` and `b` are small bounded numbers (a few languages and currencies, about ten borders), so in practice it is `O(n)`. The API returns at most about 250 countries.
- **Memory:** `O(n · (l + c + b))`, because it builds new objects and copies the lists. The input is not mutated (a test checks this). Copying `borders` means the result does not share arrays with the raw response.

### Cache and request deduplication

`createCachedSearch` (`src/search/createCachedSearch.ts`) keeps two `Map`s keyed by the query string: `cache` for finished results and `inFlight` for requests that are running.

- **Time per call:** `O(1)` on average. Looking up a key in a `Map`, adding a caller to a shared request and releasing it are constant-time operations. A cache hit does no network work and no mapping.
- **Memory:** `O(q · n)`, where `q` is the number of distinct queries cached and `n` is the number of countries in one answer (at most about 250). The cache has no size limit. This is a conscious choice: entries are small, the cache lives only as long as the page, and a user types a limited number of queries per session. If it ever mattered, the next step would be a size cap with eviction of the oldest entries.
- **Shared answers.** Cache hits return the same array that is stored in the cache, so callers must treat results as read-only. The UI never changes them.

### Search history

`createSearchHistory` (`src/search/searchHistory.ts`) keeps at most `h = 8` entries.

- **Time:** `add` filters and slices a list of at most `h` items, so it is `O(h)`, which is a constant. Reading the stored list happens once at start and costs `O(h)`.
- **Memory:** `O(h)` in the page and in `localStorage`.

## 4. Clean code principles

- **Single responsibility.** One file, one job: `debounce.ts` only handles timing, `searchCountries.ts` only talks to the API, `mapCountryResponse.ts` only maps data (split into `mapCurrency` and `mapCountry`), `classifyError.ts` only classifies errors, `createRequestSignal.ts` only combines signals, `createCachedSearch.ts` only caches, `searchHistory.ts` only stores recent queries, `searchController.ts` only coordinates them.
- **Logic is separated from the DOM.** `src/lib`, `src/api` and `src/search` never touch the DOM, so they are tested without a browser and without a real network. `src/ui` only subscribes to the controller and draws its state.
- **Pure functions.** `mapCountryResponse`, `classifyError` and `formatNumber` have no side effects and do not mutate their input.
- **Explicit states.** `SearchState` in `searchController.ts` is a discriminated union (`idle`, `loading`, `success`, `empty`, `error`), so impossible combinations cannot be represented. `renderResults` uses a `switch` over it. `ERROR_MESSAGES` in `renderStatus.ts` is a `Record` over all error kinds: adding a new kind without a message fails to compile.
- **No magic values.** Named constants: `DEBOUNCE_MS` and `REQUEST_TIMEOUT_MS` in `main.ts`, `COUNTRIES_API_URL` in `searchCountries.ts`, `DEFAULT_KEY` and `DEFAULT_LIMIT` in `searchHistory.ts`, `NO_VALUE` and `LOCALE` in `src/ui/format.ts`.
- **Errors are explicit.** `HttpError` carries the status. Nothing is swallowed except the cancellation we caused ourselves, and the storage errors in the history, which are ignored on purpose with a comment.
- **Dependencies are injected.** `renderCountryCard` receives `onSelect`. The controller receives its search function as the `search` option, so the cache is added from `main.ts` without touching the controller, and the history receives its storage as an argument, so tests use a plain object instead of `localStorage`. A card does not know about the dialog.
- **Decorator.** `createCachedSearch` wraps any function with the same signature and returns a function with the same signature. Caching is added without changing `searchCountries`.
- **Defensive reading of external data.** Anything read from `localStorage` is validated: broken JSON, a wrong type or blank entries never break the app.
- **No repetition.** The `el()` helper builds elements. `renderFact` and `renderDetail` render the repeated rows. The `—` placeholder for missing values lives in one place, `NO_VALUE` in `format.ts`, and both the card and the dialog import it.
- **Safe DOM.** There is no `innerHTML`. Text is always set with `textContent`, so user input cannot inject markup.
- **TDD and FIRST.** For each required function the failing tests are committed before the implementation. Tests use fake timers and a mocked `fetch`, so they are fast, isolated and repeatable.
