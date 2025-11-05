import type { PropsWithChildren } from 'react';

type WalletOption = 'metamask' | 'walletconnect';

interface WalletModalProps extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  onSelect: (option: WalletOption) => void;
  status: 'idle' | 'loading' | 'success' | 'error';
  feedback: string | null;
  address: string | null;
  error: string | null;
}

export function WalletModal({
  open,
  onClose,
  onSelect,
  status,
  feedback,
  address,
  error,
  children,
}: WalletModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="wallet-modal-backdrop" role="dialog" aria-modal="true">
      <div className="wallet-modal">
        <header className="wallet-modal__header">
          <h2>Connect Wallet</h2>
          <button className="wallet-modal__close" type="button" onClick={onClose} aria-label="close wallet modal">
            ✕
          </button>
        </header>

        <div className="wallet-modal__actions">
          <button className="secondary-button" type="button" onClick={() => onSelect('metamask')}>
            <span className="button-icon metamask">🦊</span>
            MetaMask
          </button>
          <button className="secondary-button" type="button" onClick={() => onSelect('walletconnect')}>
            <span className="button-icon wallet">≋</span>
            WalletConnect
          </button>
        </div>

        <div className="wallet-modal__content">
          {status === 'loading' && <div className="spinner small" aria-label="loading smart account" />}
          {error && <p className="login-error">{error}</p>}
          {feedback && <p className="wallet-feedback">{feedback}</p>}
          {status === 'success' && address && children}
        </div>
      </div>
    </div>
  );
}
