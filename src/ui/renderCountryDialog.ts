import type { Country, Currency } from '../api/types.js';
import { el } from './dom.js';
import { formatNumber } from './format.js';

const NO_VALUE = '—';
const TITLE_ID = 'country-details-title';
const FLAG_WIDTH = '96';

export interface CountryDialog {
  element: HTMLDialogElement;
  open(country: Country): void;
}

function formatList(items: string[]): string {
  return items.length > 0 ? items.join(', ') : NO_VALUE;
}

function formatCurrency(currency: Currency): string {
  const details = currency.symbol ? `${currency.code}, ${currency.symbol}` : currency.code;

  return `${currency.name} (${details})`;
}

function describeCountry(country: Country): string {
  const nativeName =
    country.nativeName !== null && country.nativeName !== country.name ? country.nativeName : null;

  return [nativeName, country.subregion, country.region]
    .filter((part): part is string => part !== null)
    .join(' · ');
}

function renderDetail(label: string, value: string): HTMLElement {
  return el('div', { className: 'details__row' }, [
    el('dt', { className: 'details__label', text: label }),
    el('dd', { className: 'details__value', text: value }),
  ]);
}

function renderContent(country: Country, onClose: () => void): HTMLElement {
  const closeButton = el('button', {
    className: 'details__close',
    text: 'Close',
    attrs: { type: 'button' },
  });

  closeButton.addEventListener('click', () => {
    onClose();
  });

  return el('div', { className: 'details__content' }, [
    el('header', { className: 'details__header' }, [
      el('img', {
        className: 'details__flag',
        attrs: { src: country.flagUrl, alt: `Flag of ${country.name}`, width: FLAG_WIDTH },
      }),
      el('div', { className: 'details__heading' }, [
        el('h2', { className: 'details__title', text: country.name, attrs: { id: TITLE_ID } }),
        el('p', { className: 'details__subtitle', text: describeCountry(country) }),
      ]),
    ]),
    el('dl', { className: 'details__list' }, [
      renderDetail('Capital', country.capital ?? NO_VALUE),
      renderDetail('Population', formatNumber(country.population)),
      renderDetail('Area', country.area === null ? NO_VALUE : `${formatNumber(country.area)} km²`),
      renderDetail('Languages', formatList(country.languages)),
      renderDetail('Currencies', formatList(country.currencies.map(formatCurrency))),
      renderDetail('Borders', formatList(country.borders)),
    ]),
    closeButton,
  ]);
}

export function createCountryDialog(): CountryDialog {
  const dialog = el('dialog', { className: 'details', attrs: { 'aria-labelledby': TITLE_ID } });

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  return {
    element: dialog,
    open(country) {
      dialog.replaceChildren(
        renderContent(country, () => {
          dialog.close();
        }),
      );
      dialog.showModal();
    },
  };
}
