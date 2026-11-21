import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useWeb3 } from '../context/Web3Context';

export default function Navbar({ activeTab, setActiveTab }) {
  const { account, tcrBalance, isAdmin, connectWallet, loading } = useWeb3();
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));

  return (
    <header>
      <div className="w nav">
        <button
          onClick={() => setActiveTab('landing')}
          className="logo"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <svg width="28" height="28" viewBox="0 0 26 26" aria-hidden="true">
            <rect width="26" height="26" rx="7" fill="#3457F1" />
            <rect x="6" y="6" width="9" height="14" rx="4.5" fill="none" stroke="#fff" strokeWidth="2.5" />
            <rect x="11" y="6" width="9" height="14" rx="4.5" fill="none" stroke="#C9F36A" strokeWidth="2.5" />
          </svg>
            FypChain
        </button>

        <nav className="nl">
          <button
            className={activeTab === 'explore' ? 'on' : ''}
            onClick={() => setActiveTab('explore')}
          >
            Explore
          </button>
          <button
            className={activeTab === 'mentorship' ? 'on' : ''}
            onClick={() => setActiveTab('mentorship')}
          >
            Mentorship
          </button>
          <button
            className={activeTab === 'registry' ? 'on' : ''}
            onClick={() => setActiveTab('registry')}
          >
            Register
          </button>
          <button
            className={activeTab === 'dashboard' ? 'on' : ''}
            onClick={() => setActiveTab('dashboard')}
          >
            Dashboard
          </button>
          {isAdmin && (
            <button
              className={activeTab === 'admin' ? 'on' : ''}
              onClick={() => setActiveTab('admin')}
            >
              Admin
            </button>
          )}
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={toggleTheme}
            title="Toggle Light/Dark Theme"
            className="btn sm"
            style={{ padding: '8px 10px' }}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {account && (
            <span className="chip" style={{ fontWeight: 700, padding: '6px 12px' }}>
              {Number(tcrBalance).toLocaleString()} TCR
            </span>
          )}

          <button
            className="btn b1 sm"
            onClick={connectWallet}
            disabled={loading}
          >
            {account ? (
              <>
                <span className="dot" /> {account.slice(0, 6)}…{account.slice(-4)}
              </>
            ) : loading ? (
              'Connecting...'
            ) : (
              'Connect wallet'
            )}
          </button>
        </div>
      </div>
    </header>
  );
}