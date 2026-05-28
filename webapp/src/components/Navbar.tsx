import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, LayoutDashboard, LogOut, Moon, Settings, Sun, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/api';
import { useGrihammData } from '../lib/useGrihammData';
import AuthModal from './AuthModal';

const Navbar = ({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { currentUser, userProfile, logout } = useAuth();
  const { data } = useGrihammData();
  const menuRef = useRef<HTMLDivElement>(null);
  const escrowBalance = (data?.projects || []).reduce((total, project) => total + project.escrowAmount, 0);

  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleConsult = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    const target = document.getElementById('contact');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#contact';
    }
  };

  const canOpenProfileSettings = userProfile?.role === 'homeowner' || userProfile?.role === 'admin';
  const dashboardLabel = userProfile?.role === 'admin'
    ? 'Admin Panel'
    : userProfile?.role === 'contractor' || userProfile?.role === 'designer'
      ? 'Professional OS'
      : 'Dashboard';

  const dashboardPath = userProfile?.role === 'admin'
    ? '/admin'
    : userProfile?.role === 'contractor' || userProfile?.role === 'designer'
      ? '/contractor-os'
      : '/track-project';
  const walletPath = userProfile?.role === 'contractor' || userProfile?.role === 'designer'
    ? '/contractor-os'
    : '/track-project';

  const getRoleClass = () => {
    if (userProfile?.role === 'admin') return 'admin';
    if (userProfile?.role === 'contractor' || userProfile?.role === 'designer') return 'professional';
    return 'homeowner';
  };

  return (
    <>
      <motion.nav
        className="site-nav"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      >
        <div className="site-nav-inner">
        <Link className="site-nav-brand" to="/">
          <img src="/logo.png" alt="Grihamm Logo" className="logo-proper" />
          <div className="site-nav-brand-text">
            <span className="site-nav-brand-name">GRIHAMM</span>
            <span className="site-nav-brand-tagline">Book. Build. Track.</span>
          </div>
        </Link>

        <div className="site-nav-links" aria-hidden="true" />

        <div className="site-nav-controls">
          <button
            onClick={toggleTheme}
            title={isDark ? 'Switch to light' : 'Switch to dark'}
            className="nav-theme-toggle"
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>

          <div className="nav-divider" />

          {currentUser ? (
            <>
            <Link to={walletPath} className="nav-wallet" aria-label="Open escrow wallet">
              <Wallet size={16} />
              <span className="nav-wallet-popover">
                <strong>{formatCurrency(escrowBalance)}</strong>
                <small>Escrow balance across your active projects.</small>
                <em>Open dashboard to add funds or review milestone releases.</em>
              </span>
            </Link>
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button
                id="user-menu-trigger"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="nav-user-trigger"
              >
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="Avatar" className="nav-user-avatar" referrerPolicy="no-referrer" />
                ) : (
                  <div className="nav-user-avatar-fallback">
                    {currentUser.displayName?.[0] || currentUser.email?.[0] || 'U'}
                  </div>
                )}
                <span className="nav-user-name">
                  {currentUser.displayName?.split(' ')[0] || currentUser.email?.split('@')[0]}
                </span>
                <ChevronDown
                  size={13}
                  style={{
                    color: 'var(--text-muted)',
                    transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: '0.25s',
                  }}
                />
              </button>

              <AnimatePresence>
                {isUserMenuOpen && (
                  <motion.div
                    id="user-menu-dropdown"
                    className="nav-menu-dropdown"
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="nav-menu-header">
                      <div className="nav-menu-signed-label">Signed in as</div>
                      <div className="nav-menu-email">{currentUser.email}</div>
                      <span className={`nav-menu-role ${getRoleClass()}`}>
                        {userProfile?.role || 'homeowner'}
                      </span>
                    </div>

                    <div className="nav-menu-divider" />

                    {canOpenProfileSettings && (
                      <Link to="/track-project?tab=settings" onClick={() => setIsUserMenuOpen(false)} className="nav-menu-item">
                        <Settings size={15} /> Profile Settings
                      </Link>
                    )}
                    <Link to={dashboardPath} onClick={() => setIsUserMenuOpen(false)} className="nav-menu-item">
                      {userProfile?.role === 'admin' ? <Settings size={15} /> : <LayoutDashboard size={15} />} {dashboardLabel}
                    </Link>
                    <div className="nav-menu-divider" />

                    <button
                      id="sign-out-btn"
                      onClick={() => { logout(); setIsUserMenuOpen(false); }}
                      className="nav-menu-item danger"
                    >
                      <LogOut size={15} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            </>
          ) : (
            <button
              id="login-btn"
              className="nav-login-btn"
              onClick={() => setIsAuthModalOpen(true)}
            >
              Login
            </button>
          )}

          <button
            id="consult-btn"
            onClick={handleConsult}
            className="btn-primary"
          >
            Consult
          </button>
        </div>
        </div>
      </motion.nav>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </>
  );
};

export default Navbar;
