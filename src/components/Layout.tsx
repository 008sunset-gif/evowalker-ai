import { useLocation, Link } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const STEPS = [
  { path: '/', label: 'トップ' },
  { path: '/scenario', label: 'レーン選択' },
  { path: '/config', label: 'AI設定' },
  { path: '/briefing', label: 'ブリーフィング' },
  { path: '/simulation', label: '歩行実験' },
  { path: '/analysis', label: '進化分析' },
  { path: '/result', label: '最終診断' },
];

export const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const currentPath = location.pathname;

  // 現在のステップインデックスを取得
  const currentStepIndex = STEPS.findIndex((step) => step.path === currentPath);

  return (
    <div className="app-container">
      {/* ヘッダー */}
      <header className="app-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 32px', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.05)', zIndex: 100, position: 'relative' }}>
        <div className="header-logo">
          <Link to="/" className="logo-link" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
            <img src="/brand_logo.png" alt="EvoWalker AI Logo" style={{ width: '32px', height: '32px', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(14,165,233,0.5))' }} />
            <span className="logo-text" style={{ fontFamily: 'var(--font-cyber)', fontSize: '20px', fontWeight: '700', color: '#f8fafc', letterSpacing: '1px' }}>
              EVOWALKER <span className="highlight" style={{ color: 'var(--color-primary)' }}>AI</span>
            </span>
          </Link>
        </div>
        <div className="header-badge" style={{ fontFamily: 'var(--font-hud)', fontSize: '13px', fontWeight: '600', color: 'var(--color-primary)', background: 'rgba(14,165,233,0.1)', padding: '4px 12px', borderRadius: '4px', border: '1px solid rgba(14,165,233,0.2)', letterSpacing: '2px', textTransform: 'uppercase' }}>
          Evolution Simulator
        </div>
      </header>

      {/* ステップインジケーター (トップ画面以外で表示) */}
      {currentStepIndex !== -1 && currentPath !== '/' && (
        <div className="step-indicator-container">
          <div className="step-progress-bar">
            <div
              className="step-progress-fill"
              style={{
                width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
              }}
            />
          </div>
          <div className="steps-list">
            {STEPS.map((step, idx) => {
              const isActive = idx === currentStepIndex;
              const isCompleted = idx < currentStepIndex;
              return (
                <div
                  key={step.path}
                  className={`step-item ${isActive ? 'active' : ''} ${
                    isCompleted ? 'completed' : ''
                  }`}
                >
                  <div className="step-number">
                    {isCompleted ? '✓' : idx + 1}
                  </div>
                  <div className="step-label">{step.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* メインコンテンツ */}
      <main className="app-main-content">
        <div className="page-wrapper">{children}</div>
      </main>

      {/* フッター */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>© 2026 EvoWalker AI - AI歩行進化シミュレーター</p>
          <div className="footer-links">
            <Link to="/">トップへ戻る</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
