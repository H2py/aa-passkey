export type AuthenticatorTransport =
  | 'usb'
  | 'nfc'
  | 'ble'
  | 'internal'
  | 'hybrid'
  | 'smart-card'
  | 'cable'
  | 'wireless';

export interface PublicKeyCredentialDescriptorJSON {
  type: 'public-key';
  id: string;
  transports?: AuthenticatorTransport[];
}

export interface PublicKeyCredentialUserEntityJSON {
  id: string;
  name: string;
  displayName: string;
}

export interface PublicKeyCredentialRpEntityJSON {
  name: string;
  id?: string;
}

export interface AuthenticatorSelectionCriteriaJSON {
  residentKey?: 'required' | 'preferred' | 'discouraged';
  requireResidentKey?: boolean;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  authenticatorAttachment?: 'platform' | 'cross-platform';
}

export interface PublicKeyCredentialCreationOptionsJSON {
  rp: PublicKeyCredentialRpEntityJSON;
  user: PublicKeyCredentialUserEntityJSON;
  challenge: string;
  pubKeyCredParams: Array<{ type: 'public-key'; alg: number }>;
  timeout?: number;
  attestation?: 'none' | 'direct' | 'indirect' | 'enterprise';
  authenticatorSelection?: AuthenticatorSelectionCriteriaJSON;
  excludeCredentials?: PublicKeyCredentialDescriptorJSON[];
  extensions?: Record<string, unknown>;
}

export interface RegistrationResponseJSON {
  id: string;
  rawId: string;
  type: 'public-key';
  response: {
    attestationObject: string;
    clientDataJSON: string;
    transports?: AuthenticatorTransport[];
  };
  clientExtensionResults?: Record<string, unknown>;
  authenticatorAttachment?: 'platform' | 'cross-platform';
}
