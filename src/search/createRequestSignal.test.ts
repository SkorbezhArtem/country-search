import { describe, expect, it } from 'vitest';
import { createRequestSignal } from './createRequestSignal.js';

const SHORT_TIMEOUT_MS = 20;
const LONG_TIMEOUT_MS = 60_000;

function waitForAbort(signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    signal.addEventListener('abort', () => resolve(), { once: true });
  });
}

describe('createRequestSignal', () => {
  it('is not aborted right after creation', () => {
    const controller = new AbortController();

    const signal = createRequestSignal(controller.signal, LONG_TIMEOUT_MS);

    expect(signal.aborted).toBe(false);
  });

  it('aborts with AbortError when the user signal aborts', () => {
    const controller = new AbortController();
    const signal = createRequestSignal(controller.signal, LONG_TIMEOUT_MS);

    controller.abort();

    expect(signal.aborted).toBe(true);
    expect(signal.reason.name).toBe('AbortError');
  });

  it('is already aborted when the user signal is already aborted', () => {
    const signal = createRequestSignal(AbortSignal.abort(), LONG_TIMEOUT_MS);

    expect(signal.aborted).toBe(true);
    expect(signal.reason.name).toBe('AbortError');
  });

  it('aborts with TimeoutError when the timeout elapses', async () => {
    const controller = new AbortController();
    const signal = createRequestSignal(controller.signal, SHORT_TIMEOUT_MS);

    await waitForAbort(signal);

    expect(signal.aborted).toBe(true);
    expect(signal.reason.name).toBe('TimeoutError');
  });

  it('does not abort the user signal when the timeout elapses', async () => {
    const controller = new AbortController();
    const signal = createRequestSignal(controller.signal, SHORT_TIMEOUT_MS);

    await waitForAbort(signal);

    expect(controller.signal.aborted).toBe(false);
  });

  it('keeps the user abort reason when the user aborts before the timeout', async () => {
    const controller = new AbortController();
    const signal = createRequestSignal(controller.signal, SHORT_TIMEOUT_MS);

    controller.abort();
    await waitForAbort(signal);

    expect(signal.reason.name).toBe('AbortError');
  });
});
