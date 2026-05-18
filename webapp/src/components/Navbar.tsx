import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BriefcaseBusiness, ChevronDown, LayoutDashboard, LogOut, Moon, Settings, Sun } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

const Navbar = ({ isDark, toggleTheme }: { isDark: boolean; toggleTheme: () => void }) => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const location = useLocation();
  const { currentUser, userProfile, logout } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);

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

  const dashboardLabel = userProfile?.role === 'admin'
    ? 'Admin Panel'
    : userProfile?.role === 'contractor' || userProfile?.role === 'designer'
      ? 'Professional OS'
      : 'Track Project';

  const dashboardPath = userProfile?.role === 'admin'
    ? '/admin'
    : userProfile?.role === 'contractor' || userProfile?.role === 'designer'
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
            <span className="site-nav-brand-tagline">Book · Build · Track</span>
          </div>
        </Link>

        <div className="site-nav-links">
          <Link
            to="/"
            className={`nav-link${location.pathname === '/' ? ' active' : ''}`}
          >
            Home
          </Link>
          <Link
            to="/marketplace"
            className={`nav-link${location.pathname === '/marketplace' ? ' active' : ''}`}
          >
            Services
          </Link>
        </div>

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

                    <Link to={dashboardPath} onClick={() => setIsUserMenuOpen(false)} className="nav-menu-item">
                      {userProfile?.role === 'admin' ? <Settings size={15} /> : <LayoutDashboard size={15} />} {dashboardLabel}
                    </Link>
                    <Link to="/marketplace" onClick={() => setIsUserMenuOpen(false)} className="nav-menu-item">
                      <BriefcaseBusiness size={15} /> Service Marketplace
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
