import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    const message = typeof payload === 'string' ? payload : payload.message ?? response.statusText;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return parseResponse<T>(response);
}

async function getJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'GET',
    credentials: 'include',
  });

  return parseResponse<T>(response);
}

export interface ApiUser {
  id: string;
  email: string;
  displayName?: string | null;
  emailVerified?: boolean;
  createdAt?: string;
}

export interface SessionResponse {
  user: ApiUser | null;
}

export async function signupUser(payload: {
  email: string;
  displayName?: string;
}): Promise<ApiUser> {
  const data = await postJson<{ ok: boolean; user: ApiUser }>('/auth/signup', payload);
  if (!data.ok || !data.user) {
    throw new Error('사용자 정보를 생성하지 못했습니다.');
  }
  return data.user;
}

export async function requestPasskeyRegistrationOptions(payload: {
  email: string;
  displayName?: string;
}): Promise<PublicKeyCredentialCreationOptionsJSON> {
  return postJson<PublicKeyCredentialCreationOptionsJSON>(
    '/auth/webauthn/register/options',
    payload,
  );
}

export async function verifyPasskeyRegistration(payload: {
  email: string;
  response: RegistrationResponseJSON;
}): Promise<ApiUser> {
  const data = await postJson<{ ok: boolean; user: ApiUser }>(
    '/auth/webauthn/register/verify',
    payload,
  );
  if (!data.ok || !data.user) {
    throw new Error('패스키 등록 검증에 실패했습니다.');
  }
  return data.user;
}

export async function requestPasskeyLoginOptions(payload: {
  email: string;
}): Promise<PublicKeyCredentialRequestOptionsJSON> {
  return postJson<PublicKeyCredentialRequestOptionsJSON>(
    '/auth/webauthn/login/options',
    payload,
  );
}

export async function verifyPasskeyLogin(payload: {
  email: string;
  response: AuthenticationResponseJSON;
}): Promise<ApiUser> {
  const data = await postJson<{ ok: boolean; user: ApiUser }>(
    '/auth/webauthn/login/verify',
    payload,
  );
  if (!data.ok || !data.user) {
    throw new Error('패스키 로그인 검증에 실패했습니다.');
  }
  return data.user;
}

export async function fetchCurrentUser(): Promise<ApiUser | null> {
  const data = await getJson<SessionResponse>('/auth/me');
  return data.user ?? null;
}

export async function logout(): Promise<void> {
  await postJson<{ ok: boolean }>('/auth/logout', {});
}
