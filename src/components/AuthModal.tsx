// cspell:ignore simplewebauthn webauthn viem Citrea PIMLICO
import { useCallback, useMemo, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { startRegistration } from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/types';
import type { Address } from 'viem';
import { DepositQR } from './DepositQR';
import { WalletModal } from './WalletModal';
import { makeAaClients } from '../lib/aa';
import {
  generatePasskeyOptions,
  requestEmailCode,
  verifyEmailCode,
  verifyPasskeyRegistration,
} from '../lib/api';

const CODE_LENGTH = 6;

type Status = 'idle' | 'loading' | 'success' | 'error';
type Step = 'email' | 'code' | 'passkey';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (email: string) => void;
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [step, setStep] = useState<Step>('email');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [registrationToken, setRegistrationToken] = useState<string | null>(null);

  const [isWalletModalOpen, setWalletModalOpen] = useState(false);
  const [walletFeedback, setWalletFeedback] = useState<string | null>(null);

  const [aaStatus, setAaStatus] = useState<Status>('idle');
  const [aaAddress, setAaAddress] = useState<Address | null>(null);
  const [aaError, setAaError] = useState<string | null>(null);

  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  const env = useMemo(() => import.meta.env as Record<string, string | undefined>, []);

  const resetState = useCallback(() => {
    setEmail('');
    setCode(Array(CODE_LENGTH).fill(''));
    setStep('email');
    setStatus('idle');
    setError(null);
    setInfoMessage(null);
    setRegistrationToken(null);
    setWalletModalOpen(false);
    setWalletFeedback(null);
    setAaStatus('idle');
    setAaAddress(null);
    setAaError(null);
  }, []);

  const closeModal = useCallback(() => {
    resetState();
    onClose();
  }, [onClose, resetState]);

  const handleEmailSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('이메일을 입력해주세요.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);
    setInfoMessage('인증 메일을 전송하는 중입니다...');
    setStep('code');
    setCode(Array(CODE_LENGTH).fill(''));

    try {
      await requestEmailCode(trimmedEmail);
      setStatus('idle');
      setInfoMessage(`${trimmedEmail}로 인증 코드를 전송했습니다.`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || '메일 전송 중 오류가 발생했습니다.');
      setStatus('error');
      setStep('email');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    const sanitized = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...code];
    next[index] = sanitized;
    setCode(next);

    if (sanitized && index < CODE_LENGTH - 1) {
      codeRefs.current[index + 1]?.focus();
    }
  };

  const handleCodeKeyDown = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) {
      event.preventDefault();
      const prevIndex = index - 1;
      const next = [...code];
      next[prevIndex] = '';
      setCode(next);
      codeRefs.current[prevIndex]?.focus();
    }
  };

  const handleVerifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (code.some((digit) => digit === '')) {
      setError('6자리 코드를 모두 입력해주세요.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const result = await verifyEmailCode({ email: trimmedEmail, code: code.join('') });
      setRegistrationToken(result.registrationToken);
      setStatus('idle');

      if (result.isNewUser) {
        setStep('passkey');
        setInfoMessage('패스키를 등록하면 회원가입이 완료됩니다.');
      } else {
        setInfoMessage('로그인에 성공했습니다.');
        setStatus('success');
        onAuthenticated(trimmedEmail);
        closeModal();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || '코드를 확인하는 중 오류가 발생했습니다.');
      setStatus('error');
    }
  };

  const ensureAaContext = useCallback(async () => {
    if (aaStatus === 'loading' || aaAddress) {
      return;
    }

    setAaStatus('loading');

    try {
      if (!env.VITE_CITREA_RPC || !env.VITE_PIMLICO_URL) {
        throw new Error('환경 변수를 확인해주세요.');
      }

      const ctx = await makeAaClients();
      setAaAddress(ctx.accountAddress);
      setAaStatus('success');
      setAaError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setAaError(message);
      setAaStatus('error');
    }
  }, [aaAddress, aaStatus, env]);

  const handleOpenWalletModal = () => {
    setWalletModalOpen(true);
    setWalletFeedback(null);
    ensureAaContext();
  };

  const handleWalletSelect = (option: 'metamask' | 'walletconnect') => {
    if (option === 'metamask') {
      setWalletFeedback('MetaMask 연결을 준비 중입니다. 브라우저 확장을 확인해주세요.');
      return;
    }

    if (option === 'walletconnect') {
      if (!aaAddress) {
        setWalletFeedback('스마트 계정 정보를 불러오고 있습니다. 잠시만 기다려주세요.');
        ensureAaContext();
        return;
      }

      setWalletFeedback('WalletConnect를 통해 스마트 계정을 연결하세요.');
    }
  };

  const handleRegisterPasskey = async () => {
    if (!registrationToken) {
      setError('등록 토큰이 만료되었습니다. 처음부터 다시 시도해주세요.');
      setStatus('error');
      setStep('email');
      return;
    }

    setStatus('loading');
    setError(null);

    try {
      const options: PublicKeyCredentialCreationOptionsJSON = await generatePasskeyOptions({
        registrationToken,
      });
      const credential: RegistrationResponseJSON = await startRegistration(options);
      const verification = await verifyPasskeyRegistration({ registrationToken, credential });

      if (!verification.verified) {
        throw new Error('패스키 등록에 실패했습니다.');
      }

      setStatus('success');
      setInfoMessage('패스키 등록이 완료되었습니다.');
      onAuthenticated(email.trim());
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || '패스키 등록 중 오류가 발생했습니다.');
      setStatus('error');
    }
  };

  if (!open) {
    return null;
  }

  return (
    <div className="auth-modal-overlay">
      <div className="login-container">
        <div className="login-header">
          <div className="login-badges">
            <span className="login-badge">F</span>
            <span className="login-badge">Ξ</span>
          </div>
          <button aria-label="close" className="login-close" type="button" onClick={closeModal}>
            ✕
          </button>
        </div>

        {step === 'email' && (
          <>
            <h1>Connect to Citrea</h1>
            <p className="read-the-docs">로그인 / 회원가입을 진행해주세요.</p>

            <form className="login-form card" onSubmit={handleEmailSubmit}>
              <label className="login-label" htmlFor="email">
                이메일
              </label>
              <input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                disabled={status === 'loading'}
              />

              <button className="primary-button" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? '메일 전송 중...' : 'Login / Sign up'}
              </button>

              <div className="divider">
                <span>OR</span>
              </div>

              <button className="secondary-button" type="button" disabled>
                <span className="button-icon google">G</span>
                Google (준비 중)
              </button>

              <button
                className="secondary-button"
                type="button"
                onClick={handleOpenWalletModal}
              >
                <span className="button-icon wallet">≋</span>
                Connect Wallet
              </button>

              {status === 'error' && error && <p className="login-error">{error}</p>}
              {status === 'success' && infoMessage && (
                <p className="login-success">{infoMessage}</p>
              )}
            </form>
          </>
        )}

        {step === 'code' && (
          <div className="code-step card">
            <div className="code-icon" aria-hidden>
              ✉️
            </div>
            <p className="code-instruction">
              {infoMessage ?? `${email}로 전송한 코드를 입력해주세요.`}
            </p>

            {status === 'loading' ? (
              <div className="spinner" aria-label="loading" />
            ) : (
              <form className="code-form" onSubmit={handleVerifyCode}>
                <div className="code-inputs">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        codeRefs.current[index] = element;
                      }}
                      className="code-input"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={digit}
                      onChange={(event) => handleCodeChange(index, event.target.value)}
                      onKeyDown={(event) => handleCodeKeyDown(event, index)}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>

                <button className="primary-button" type="submit">
                  확인
                </button>
              </form>
            )}

            <button
              className="link-button"
              type="button"
              onClick={() => {
                setStep('email');
                setStatus('idle');
                setError(null);
              }}
            >
              다른 이메일 사용하기
            </button>

            {status === 'error' && error && <p className="login-error">{error}</p>}
            {status === 'success' && infoMessage && (
              <p className="login-success">{infoMessage}</p>
            )}
          </div>
        )}

        {step === 'passkey' && (
          <div className="code-step card">
            <div className="code-icon" aria-hidden>
              🔐
            </div>
            <p className="code-instruction">
              {infoMessage ?? '디바이스에서 안내하는 절차에 따라 패스키를 등록해주세요.'}
            </p>

            <button
              className="primary-button"
              type="button"
              onClick={handleRegisterPasskey}
              disabled={status === 'loading'}
            >
              {status === 'loading' ? '패스키 등록 중...' : '패스키 등록 시작'}
            </button>

            <button className="link-button" type="button" onClick={closeModal}>
              나중에 등록하기
            </button>

            {status === 'error' && error && <p className="login-error">{error}</p>}
            {status === 'success' && infoMessage && (
              <p className="login-success">{infoMessage}</p>
            )}
          </div>
        )}

        <WalletModal
          open={isWalletModalOpen}
          onClose={() => setWalletModalOpen(false)}
          onSelect={handleWalletSelect}
          status={aaStatus}
          feedback={walletFeedback}
          address={aaAddress}
          error={aaError}
        >
          {aaAddress && (
            <div className="walletconnect-qr">
              <DepositQR address={aaAddress} token={env.VITE_USDC} />
            </div>
          )}
        </WalletModal>
      </div>
    </div>
  );
}
