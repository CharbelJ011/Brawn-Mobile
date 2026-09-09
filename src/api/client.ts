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

function looksLikeCanceledFetch(error: unknown, controller: AbortController) {
  if (controller.signal.aborted) return true;
  if (!(error instanceof Error)) return false;
  return error.name === 'AbortError' || /FetchRequestCanceledException|canceled|cancelled/i.test(error.message);
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_URL}${normalizedPath}`;
  const method = (init?.method ?? 'GET').toUpperCase();
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    console.warn(`[Brawn API] timeout reached for ${method} ${url}; aborting native request`);
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  const hasBody = init?.body != null;
  const headers: Record<string, string> = {
    ...((init?.headers ?? {}) as Record<string, string>),
  };
  if (hasBody && !Object.keys(headers).some((key) => key.toLowerCase() === 'content-type')) {
    headers['Content-Type'] = 'application/json';
  }

  console.log(`[Brawn API] -> ${method} ${url}`);
  console.log('[Brawn API] request details:', {
    method,
    hasBody,
    timeoutMs: REQUEST_TIMEOUT_MS,
    credentials: 'omit',
    headers,
  });

  try {
    const response = await fetch(url, {
      ...init,
      method,
      headers,
      credentials: 'omit',
      signal: controller.signal,
    });

    const elapsedMs = Date.now() - startedAt;
    console.log(`[Brawn API] native response received after ${elapsedMs}ms`);

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
    const canceled = looksLikeCanceledFetch(error, controller);
    console.error(`[Brawn API] !! ${method} ${url} failed after ${elapsedMs}ms`, {
      name: error instanceof Error ? error.name : typeof error,
      message: error instanceof Error ? error.message : String(error),
      controllerAborted: controller.signal.aborted,
      classifiedAsCanceled: canceled,
      apiUrl: API_URL,
    });

    if (canceled) {
      throw new ApiError(`Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s while connecting to ${API_URL}.`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
