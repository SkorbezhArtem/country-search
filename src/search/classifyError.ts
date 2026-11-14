import { HttpError } from '../api/HttpError.js';

export type SearchErrorKind = 'aborted' | 'timeout' | 'http' | 'network' | 'unknown';

function hasName(error: unknown, name: string): boolean {
  return typeof error === 'object' && error !== null && 'name' in error && error.name === name;
}

export function classifyError(error: unknown): SearchErrorKind {
  if (hasName(error, 'AbortError')) {
    return 'aborted';
  }

  if (hasName(error, 'TimeoutError')) {
    return 'timeout';
  }

  if (error instanceof HttpError) {
    return 'http';
  }

  if (error instanceof TypeError) {
    return 'network';
  }

  return 'unknown';
}
