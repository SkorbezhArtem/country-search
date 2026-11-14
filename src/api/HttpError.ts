export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, statusText = '') {
    super(statusText ? `HTTP ${status}: ${statusText}` : `HTTP ${status}`);
    this.name = 'HttpError';
    this.status = status;
  }
}
