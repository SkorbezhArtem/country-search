const SVG_NS = 'http://www.w3.org/2000/svg';
const ICON_SIZE = '18';

export type IconName = 'system' | 'light' | 'dark' | 'cards' | 'list';

interface Shape {
  tag: 'circle' | 'rect' | 'path';
  attrs: Record<string, string>;
}

const ICON_SHAPES: Record<IconName, Shape[]> = {
  system: [
    { tag: 'rect', attrs: { x: '2', y: '3', width: '20', height: '14', rx: '2' } },
    { tag: 'path', attrs: { d: 'M8 21h8' } },
    { tag: 'path', attrs: { d: 'M12 17v4' } },
  ],
  light: [
    { tag: 'circle', attrs: { cx: '12', cy: '12', r: '4' } },
    { tag: 'path', attrs: { d: 'M12 2v2' } },
    { tag: 'path', attrs: { d: 'M12 20v2' } },
    { tag: 'path', attrs: { d: 'm4.93 4.93 1.41 1.41' } },
    { tag: 'path', attrs: { d: 'm17.66 17.66 1.41 1.41' } },
    { tag: 'path', attrs: { d: 'M2 12h2' } },
    { tag: 'path', attrs: { d: 'M20 12h2' } },
    { tag: 'path', attrs: { d: 'm6.34 17.66-1.41 1.41' } },
    { tag: 'path', attrs: { d: 'm19.07 4.93-1.41 1.41' } },
  ],
  dark: [{ tag: 'path', attrs: { d: 'M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z' } }],
  cards: [
    { tag: 'rect', attrs: { x: '3', y: '3', width: '7', height: '7', rx: '1' } },
    { tag: 'rect', attrs: { x: '14', y: '3', width: '7', height: '7', rx: '1' } },
    { tag: 'rect', attrs: { x: '3', y: '14', width: '7', height: '7', rx: '1' } },
    { tag: 'rect', attrs: { x: '14', y: '14', width: '7', height: '7', rx: '1' } },
  ],
  list: [
    { tag: 'path', attrs: { d: 'M8 6h13' } },
    { tag: 'path', attrs: { d: 'M8 12h13' } },
    { tag: 'path', attrs: { d: 'M8 18h13' } },
    { tag: 'path', attrs: { d: 'M3 6h.01' } },
    { tag: 'path', attrs: { d: 'M3 12h.01' } },
    { tag: 'path', attrs: { d: 'M3 18h.01' } },
  ],
};

export function renderIcon(name: IconName): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');

  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', ICON_SIZE);
  svg.setAttribute('height', ICON_SIZE);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');

  for (const shape of ICON_SHAPES[name]) {
    const element = document.createElementNS(SVG_NS, shape.tag);

    for (const [key, value] of Object.entries(shape.attrs)) {
      element.setAttribute(key, value);
    }

    svg.append(element);
  }

  return svg;
}
