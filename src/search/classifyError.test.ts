import { describe, expect, it } from 'vitest';
import { HttpError } from '../api/HttpError.js';
import { classifyError } from './classifyError.js';

describe('classifyError', () => {
  it('classifies a cancelled request as aborted', () => {
    const error = new DOMException('The operation was aborted.', 'AbortError');

    expect(classifyError(error)).toBe('aborted');
  });

  it('classifies the reason of an aborted signal as aborted', () => {
    expect(classifyError(AbortSignal.abort().reason)).toBe('aborted');
  });

  it('classifies an error named AbortError as aborted even if it is not a DOMException', () => {
    const error = Object.assign(new Error('cancelled'), { name: 'AbortError' });

    expect(classifyError(error)).toBe('aborted');
  });

  it('classifies a timeout as timeout, not as aborted', () => {
    const error = new DOMException('The operation timed out.', 'TimeoutError');

    expect(classifyError(error)).toBe('timeout');
  });

  it('classifies HttpError as http', () => {
    expect(classifyError(new HttpError(500, 'Internal Server Error'))).toBe('http');
  });

  it('classifies a failed fetch as network', () => {
    expect(classifyError(new TypeError('Failed to fetch'))).toBe('network');
  });

  it('classifies any other error as unknown', () => {
    expect(classifyError(new Error('boom'))).toBe('unknown');
  });

  it.each([
    ['a string', 'boom'],
    ['null', null],
    ['undefined', undefined],
    ['an empty object', {}],
  ])('classifies %s as unknown', (_name, value) => {
    expect(classifyError(value)).toBe('unknown');
  });
});
