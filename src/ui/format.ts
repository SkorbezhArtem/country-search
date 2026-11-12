const LOCALE = 'en-US';

const numberFormatter = new Intl.NumberFormat(LOCALE);

export function formatNumber(value: number): string {
  return numberFormatter.format(value);
}
