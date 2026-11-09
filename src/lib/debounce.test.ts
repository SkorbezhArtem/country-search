import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { debounce } from './debounce.js';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not call fn synchronously', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();

    expect(fn).not.toHaveBeenCalled();
  });

  it('does not call fn before the delay elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(99);

    expect(fn).not.toHaveBeenCalled();
  });

  it('calls fn once when the delay elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('resets the timer when called again before the delay elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    debounced();
    vi.advanceTimersByTime(50);
    debounced();
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('calls fn only once for a burst of rapid calls', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);

    for (let i = 0; i < 5; i++) {
      debounced();
      vi.advanceTimersByTime(30);
    }
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes the arguments of the last call to fn', () => {
    const fn = vi.fn<(value: string) => void>();
    const debounced = debounce(fn, 100);

    debounced('s');
    debounced('sp');
    debounced('spain');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledWith('spain');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('can fire again after it has already fired', () => {
    const fn = vi.fn<(value: string) => void>();
    const debounced = debounce(fn, 100);

    debounced('first');
    vi.advanceTimersByTime(100);
    debounced('second');
    vi.advanceTimersByTime(100);

    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'first');
    expect(fn).toHaveBeenNthCalledWith(2, 'second');
  });

  it('keeps timers of different debounced functions independent', () => {
    const first = vi.fn();
    const second = vi.fn();
    const debouncedFirst = debounce(first, 100);
    const debouncedSecond = debounce(second, 100);

    debouncedFirst();
    vi.advanceTimersByTime(50);
    debouncedSecond();
    vi.advanceTimersByTime(50);

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).not.toHaveBeenCalled();
  });
});
