import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';

const API_BASE =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response
      .json()
      .catch(() => ({ message: response.statusText }));
    const errorText = typeof message === 'string' ? message : message.message ?? response.statusText;
    throw new Error(errorText);
  }
  return (await response.json()) as T;
}

export async function requestEmailCode(email: string): Promise<void> {
  const response = await fetch(`${API_BASE}/auth/email/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });

  await handleResponse<{ success: boolean }>(response);
}

export interface VerifyEmailCodeResponse {
  registrationToken: string;
  isNewUser: boolean;
}

export async function verifyEmailCode({
  email,
  code,
}: {
  email: string;
  code: string;
}): Promise<VerifyEmailCodeResponse> {
  const response = await fetch(`${API_BASE}/auth/email/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });

  return handleResponse<VerifyEmailCodeResponse>(response);
}

export async function generatePasskeyOptions({
  registrationToken,
}: {
  registrationToken: string;
}): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const response = await fetch(`${API_BASE}/auth/passkey/register/options`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationToken }),
  });

  return handleResponse<PublicKeyCredentialCreationOptionsJSON>(response);
}

export async function verifyPasskeyRegistration({
  registrationToken,
  credential,
}: {
  registrationToken: string;
  credential: RegistrationResponseJSON;
}): Promise<{ verified: boolean }> {
  const response = await fetch(`${API_BASE}/auth/passkey/register/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ registrationToken, credential }),
  });

  return handleResponse<{ verified: boolean }>(response);
}
