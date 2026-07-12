const API_URL = process.env.EXPO_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('Missing EXPO_PUBLIC_API_URL. Set it to your deployed backend URL before starting or building the app.');
}

export async function apiFetch(path, { token, ...options } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error ?? 'Request failed');
  return body;
}
