const RAW_API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';
const API_URL = RAW_API_URL.replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 15000;

console.log('[Brawn API] configured base URL:', API_URL);
console.log('[Brawn API] EXPO_PUBLIC_API_URL present:', Boolean(process.env.EXPO_PUBLIC_API_URL));

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_URL}${normalizedPath}`;
  const method = init?.method ?? 'GET';
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  console.log(`[Brawn API] -> ${method} ${url}`);
  console.log('[Brawn API] request details:', {
    method,
    hasBody: Boolean(init?.body),
    timeoutMs: REQUEST_TIMEOUT_MS,
  });

  try {
    const response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
      credentials: 'include',
      signal: controller.signal,
    });

    const elapsedMs = Date.now() - startedAt;
    const rawBody = await response.text();
    let body: any = null;
    if (rawBody) {
      try {
        body = JSON.parse(rawBody);
      } catch {
        body = rawBody;
      }
    }

    console.log(`[Brawn API] <- ${response.status} ${method} ${url} (${elapsedMs}ms)`);
    console.log('[Brawn API] response body:', body);

    if (!response.ok) {
      const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
      throw new ApiError(message || `Request failed (${response.status})`, response.status);
    }

    return body as T;
  } catch (error) {
    const elapsedMs = Date.now() - startedAt;
    const isAbort = error instanceof Error && error.name === 'AbortError';
    console.error(`[Brawn API] !! ${method} ${url} failed after ${elapsedMs}ms`, {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      aborted: isAbort,
      apiUrl: API_URL,
    });

    if (isAbort) {
      throw new ApiError(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s while connecting to ${API_URL}.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
