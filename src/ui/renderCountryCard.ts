import type { Country } from '../api/types.js';
import { el } from './dom.js';
import { formatNumber, NO_VALUE } from './format.js';

const FLAG_WIDTH = '48';

function renderFact(label: string, value: string): HTMLElement {
  return el('span', { className: 'country-card__fact' }, [
    el('span', { className: 'country-card__label', text: label }),
    el('span', { className: 'country-card__value', text: value }),
  ]);
}

export function renderCountryCard(
  country: Country,
  onSelect: (country: Country) => void,
): HTMLLIElement {
  const flag = el('img', {
    className: 'country-card__flag',
    attrs: {
      src: country.flagUrl,
      alt: `Flag of ${country.name}`,
      width: FLAG_WIDTH,
      loading: 'lazy',
    },
  });

  const body = el('span', { className: 'country-card__body' }, [
    el('span', { className: 'country-card__name', text: country.name }),
    renderFact('Capital', country.capital ?? NO_VALUE),
    renderFact('Region', country.region),
    renderFact('Population', formatNumber(country.population)),
  ]);

  const button = el('button', { className: 'country-card', attrs: { type: 'button' } }, [
    flag,
    body,
  ]);

  button.addEventListener('click', () => {
    onSelect(country);
  });

  return el('li', { className: 'country-list__item' }, [button]);
}
