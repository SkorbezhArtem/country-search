import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { antarctica } from './__fixtures__/antarctica.js';
import { spain } from './__fixtures__/spain.js';
import { HttpError } from './HttpError.js';
import { searchCountries } from './searchCountries.js';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function failedResponse(status: number, statusText: string, body: string): Response {
  return new Response(body, { status, statusText });
}

describe('searchCountries', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const signal = new AbortController().signal;

  beforeEach(() => {
    fetchMock.mockReset();
    fetchMock.mockImplementation(() => Promise.resolve(jsonResponse([])));
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the countries.dev name endpoint', async () => {
    await searchCountries('spain', signal);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('https://countries.dev/name/spain');
  });

  it.each([
    ['new zealand', 'new%20zealand'],
    ['côte', 'c%C3%B4te'],
    ['a/b?c#d', 'a%2Fb%3Fc%23d'],
  ])('encodes the query "%s" in the url', async (query, encoded) => {
    await searchCountries(query, signal);

    expect(fetchMock.mock.calls[0]?.[0]).toBe(`https://countries.dev/name/${encoded}`);
  });

  it('passes the abort signal to fetch', async () => {
    await searchCountries('spain', signal);

    expect(fetchMock.mock.calls[0]?.[1]?.signal).toBe(signal);
  });

  it('returns countries mapped to the app model', async () => {
    fetchMock.mockResolvedValue(jsonResponse([spain, antarctica]));

    const result = await searchCountries('a', signal);

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ code: 'ESP', name: 'Spain', capital: 'Madrid' });
    expect(result[1]).toMatchObject({ code: 'ATA', name: 'Antarctica', capital: null });
  });

  it('returns an empty array when the api returns an empty list', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]));

    await expect(searchCountries('spain', signal)).resolves.toEqual([]);
  });

  it('returns an empty array on 404 without parsing the body as json', async () => {
    fetchMock.mockResolvedValue(failedResponse(404, 'Not Found', 'Country not found'));

    await expect(searchCountries('zzzzzz', signal)).resolves.toEqual([]);
  });

  it.each([400, 403, 429, 500, 503])('throws HttpError with status %i', async (status) => {
    fetchMock.mockResolvedValue(failedResponse(status, 'Failure', 'error'));

    const promise = searchCountries('spain', signal);

    await expect(promise).rejects.toBeInstanceOf(HttpError);
    await expect(promise).rejects.toMatchObject({ name: 'HttpError', status });
  });

  it.each([
    ['a network failure', new TypeError('Failed to fetch')],
    ['an abort', new DOMException('The operation was aborted.', 'AbortError')],
    ['a timeout', new DOMException('The operation timed out.', 'TimeoutError')],
  ])('rethrows %s from fetch unchanged', async (_name, error) => {
    fetchMock.mockRejectedValue(error);

    await expect(searchCountries('spain', signal)).rejects.toBe(error);
  });
});
