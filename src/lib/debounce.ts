export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  delay: number,
): (...args: A) => void {
  void fn;
  void delay;
  throw new Error('not implemented');
}
