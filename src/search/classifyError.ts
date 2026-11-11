export type SearchErrorKind = 'aborted' | 'timeout' | 'http' | 'network' | 'unknown';

export function classifyError(error: unknown): SearchErrorKind {
  void error;
  throw new Error('not implemented');
}
