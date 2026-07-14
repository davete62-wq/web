import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/theme';

const TOKEN_KEY = 'tenafit.jwt';

export type ApiOptions = RequestInit & {
  auth?: boolean;
};

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

export async function saveToken(token: string) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}

export async function getToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export async function clearToken() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const token = options.auth === false ? null : await getToken();
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    }
  });

  const body = await readJson(response);
  if (!response.ok) {
    throw new Error(body?.error ?? body?.message ?? 'Server request failed');
  }
  return body as T;
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.startsWith('251')) return `+${digits}`;
  if (digits.startsWith('0')) return `+251${digits.slice(1)}`;
  return `+251${digits}`;
}

export async function requestOtp(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  return apiFetch<{ status?: string; ok?: boolean; message?: string; requestId?: string }>('/auth/phone/start', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ phone: normalizedPhone })
  });
}

export async function verifyOtp(phone: string, code: string) {
  const normalizedPhone = normalizePhone(phone);
  const data = await apiFetch<{ token?: string; jwt?: string; user?: unknown }>('/auth/phone/verify', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ phone: normalizedPhone, code })
  });
  const token = data.token ?? data.jwt;
  if (!token) throw new Error('Verification succeeded but no token was returned');
  await saveToken(token);
  return { ...data, token };
}

export async function fetchDietPlan() {
  return apiFetch<any>('/meal-plans/today');
}

export async function createDietPlan(profile: Record<string, unknown>) {
  return apiFetch<any>('/meal-plans', {
    method: 'POST',
    body: JSON.stringify(profile)
  });
}
