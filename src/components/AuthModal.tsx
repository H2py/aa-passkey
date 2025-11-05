import { useCallback, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';
import type { Address } from 'viem';
import { DepositQR } from './DepositQR';
import { WalletModal } from './WalletModal';
import { makeAaClients } from '../lib/aa';
import {
  type ApiUser,
  requestPasskeyLoginOptions,
  requestPasskeyRegistrationOptions,
  signupUser,
  verifyPasskeyLogin,
  verifyPasskeyRegistration,
} from '../lib/api';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: ApiUser) => void;
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const [isWalletModalOpen, setWalletModalOpen] = useState(false);
  const [walletFeedback, setWalletFeedback] = useState<string | null>(null);

  const [aaStatus, setAaStatus] = useState<Status>('idle');
  const [aaAddress, setAaAddress] = useState<Address | null>(null);
  const [aaError, setAaError] = useState<string | null>(null);

  const env = useMemo(() => import.meta.env as Record<string, string | undefined>, []);

  const resetState = useCallback(() => {
    setStatus('idle');
    setError(null);
    setInfoMessage(null);
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

  const browserSupportsPasskey = () =>
    typeof window !== 'undefined' && typeof window.PublicKeyCredential !== 'undefined';

  const handlePasskeyRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('이메일을 입력해주세요.');
      setStatus('error');
      return;
    }

    if (!browserSupportsPasskey()) {
      setError('이 브라우저에서는 패스키를 지원하지 않습니다. 다른 브라우저를 사용해주세요.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);
    setInfoMessage('디바이스에서 패스키 등록 창이 뜨면 승인해주세요.');

    try {
      const name = displayName.trim() || trimmedEmail;
      await signupUser({ email: trimmedEmail, displayName: name });

      const options = await requestPasskeyRegistrationOptions({
        email: trimmedEmail,
        displayName: name,
      });

      const credential = await startRegistration(options);
      const user = await verifyPasskeyRegistration({
        email: trimmedEmail,
        response: credential,
      });

      setStatus('success');
      setInfoMessage('패스키 등록이 완료되었습니다.');
      onAuthenticated(user);
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || '패스키 등록 중 오류가 발생했습니다.');
      setInfoMessage(null);
      setStatus('error');
    }
  };

  const handlePasskeyLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('이메일을 입력해주세요.');
      setStatus('error');
      return;
    }

    if (!browserSupportsPasskey()) {
      setError('이 브라우저에서는 패스키를 지원하지 않습니다. 다른 브라우저를 사용해주세요.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError(null);
    setInfoMessage('디바이스에서 패스키 인증을 진행해주세요.');

    try {
      const options = await requestPasskeyLoginOptions({ email: trimmedEmail });
      const assertion = await startAuthentication(options);
      const user = await verifyPasskeyLogin({
        email: trimmedEmail,
        response: assertion,
      });

      setStatus('success');
      setInfoMessage('로그인에 성공했습니다.');
      onAuthenticated(user);
      closeModal();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      setError(message || '패스키 로그인에 실패했습니다.');
      setInfoMessage(null);
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

        <h1>Connect to Citrea</h1>
        <p className="read-the-docs">
          패스키 또는 Web3 지갑을 연결해 Citrea Market을 이용해보세요.
        </p>

        <form className="login-form card" onSubmit={handlePasskeyRegister}>
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

          <label className="login-label" htmlFor="displayName">
            표시 이름 (선택)
          </label>
          <input
            id="displayName"
            type="text"
            placeholder="Citrea Builder"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            autoComplete="name"
            disabled={status === 'loading'}
          />

          <button className="primary-button" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? '패스키 처리 중...' : 'Sign up with Passkey'}
          </button>

          <button
            className="secondary-button"
            type="button"
            onClick={handlePasskeyLogin}
            disabled={status === 'loading'}
          >
            Login with Passkey
          </button>

          <div className="divider">
            <span>OR</span>
          </div>

          <button
            className="secondary-button"
            type="button"
            onClick={handleOpenWalletModal}
          >
            <span className="button-icon wallet">≋</span>
            Connect Wallet
          </button>

          {error && status === 'error' && <p className="login-error">{error}</p>}
          {infoMessage && status !== 'error' && <p className="login-info">{infoMessage}</p>}
        </form>

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
