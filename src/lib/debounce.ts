export type DebouncedFunction<A extends unknown[]> = ((...args: A) => void) & {
  cancel(): void;
};

export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
): DebouncedFunction<A> {
  let timerId: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: A): void => {
    clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn(...args);
    }, delay);
  };

  return Object.assign(debounced, {
    cancel(): void {
      throw new Error('not implemented');
    },
  });
}
