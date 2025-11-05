import './App.css';
import { useEffect, useState } from 'react';
import { AuthModal } from './components/AuthModal';
import type { ApiUser } from './lib/api';
import { fetchCurrentUser, logout } from './lib/api';

const FEATURED_PRODUCTS = [
  {
    id: 1,
    name: 'Citrea Hoodie',
    price: '89,000원',
    description: '제로 지식 패턴의 프리미엄 후드 집업',
    badge: 'New',
  },
  {
    id: 2,
    name: 'Rollup Keyboard',
    price: '159,000원',
    description: '라이트닝 반응 속도를 가진 커스텀 키보드',
    badge: 'Hot',
  },
  {
    id: 3,
    name: 'AA Starter Pack',
    price: '129,000원',
    description: '스마트 계정 개발자를 위한 하드웨어 번들',
    badge: 'Limited',
  },
  {
    id: 4,
    name: 'Citrea Nodes',
    price: '219,000원',
    description: '테스트넷 운영자용 mini PC 노드',
    badge: 'Ships in 48h',
  },
];

function App() {
  const [isAuthOpen, setAuthOpen] = useState(false);
  const [user, setUser] = useState<ApiUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetchCurrentUser()
      .then((currentUser) => {
        if (!cancelled) {
          setUser(currentUser);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          console.warn('세션 정보를 불러오는 중 오류가 발생했습니다.', err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthenticated = (nextUser: ApiUser) => {
    setUser(nextUser);
    setAuthOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
    } catch (err) {
      console.warn('로그아웃 요청 중 오류가 발생했습니다.', err);
    }
  };

  return (
    <div className="store-app">
      <header className="store-header">
        <a className="brand" href="/">
          Citrea Market
        </a>

        <nav className="store-nav">
          <a href="#collections">Collections</a>
          <a href="#hardware">Hardware</a>
          <a href="#docs">Docs</a>
        </nav>

        <div className="store-actions">
          {user ? <span className="user-chip">{user.email}</span> : null}
          {user ? (
            <button className="link-button" type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <button className="connect-button" type="button" onClick={() => setAuthOpen(true)}>
            Connect Wallet
            </button>
          )}
          
        </div>
      </header>

      <main className="store-main">
        <section className="hero">
          <div className="hero-content">
            <span className="hero-badge">Citrea Exclusive</span>
            <h1>Rollups ready commerce, powered by Account Abstraction</h1>
            <p>
              Citrea Market는 Web3 지갑 연결과 패스키 인증을 결합한 차세대 쇼핑 경험을 제공합니다.
              스마트 계정으로 한 번만 등록하면 모든 서비스를 사용할 수 있어요.
            </p>
            <div className="hero-actions">
              <button className="secondary-button" type="button">
                Explore Catalog
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-card">
              <span>Next delivery</span>
              <strong>Citrea Lightning Node</strong>
              <p>Track shipments and manage paymasters in 하나의 대시보드</p>
            </div>
            <div className="hero-card">
              <span>Passkey secured</span>
              <strong>Safest Checkout</strong>
              <p>생체 인증으로 결제 승인까지 한 번에 완료</p>
            </div>
          </div>
        </section>

        <section className="product-section" id="collections">
          <div className="section-header">
            <h2>Featured Collections</h2>
            <button className="link-button" type="button">
              전체 보기
            </button>
          </div>

          <div className="product-grid">
            {FEATURED_PRODUCTS.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-media">
                  <span className="product-badge">{product.badge}</span>
                </div>
                <div className="product-body">
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                  <div className="product-footer">
                    <span className="product-price">{product.price}</span>
                    <button className="tertiary-button" type="button">
                      Add to cart
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="store-footer">
        <span>© {new Date().getFullYear()} Citrea Market. All rights reserved.</span>
        <div className="footer-links">
          <a href="#privacy">Privacy</a>
          <a href="#terms">Terms</a>
          <a href="#support">Support</a>
        </div>
      </footer>

      <AuthModal
        open={isAuthOpen}
        onClose={() => setAuthOpen(false)}
        onAuthenticated={handleAuthenticated}
      />
    </div>
  );
}

export default App;
