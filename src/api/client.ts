const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://127.0.0.1:3001';

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    credentials: 'include',
  });

  let body: any = null;
  try {
    body = await response.json();
  } catch {
    // Keep null body for non-JSON responses.
  }

  if (!response.ok) {
    const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
    throw new ApiError(message || `Request failed (${response.status})`, response.status);
  }

  return body as T;
}
