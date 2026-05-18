import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Admin from './pages/Admin';
import ProjectOS from './pages/ProjectOS';
import ContractorRegister from './pages/ContractorRegister';
import ContractorOS from './pages/ContractorOS';
import ProfileSetupModal from './components/ProfileSetupModal';
import { useAuth } from './contexts/AuthContext';
import MvpPrototype from './pages/MvpPrototype';
import HomePage from './pages/HomePage';
import LegalPage from './pages/LegalPage';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: string[] }) => {
  const { userProfile, loading } = useAuth();
  if (loading) return null;
  if (!userProfile) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const RoleDashboardRedirect = () => {
  const { userProfile, loading } = useAuth();
  if (loading) return null;
  if (!userProfile) return <Navigate to="/" replace />;
  if (userProfile.role === 'admin') return <Navigate to="/admin" replace />;
  if (userProfile.role === 'contractor' || userProfile.role === 'designer') return <Navigate to="/contractor-os" replace />;
  return <Navigate to="/track-project" replace />;
};

function App() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const { userProfile, currentUser } = useAuth();
  const showSetup = Boolean(currentUser && userProfile && !userProfile.profileCompleted && userProfile.role !== 'admin');

  React.useEffect(() => {
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <Router>
      <div className="app">
        <Navbar isDark={isDark} toggleTheme={toggleTheme} />
        <main>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/marketplace" element={<MvpPrototype />} />
            <Route path="/brand" element={<Navigate to="/" replace />} />
            <Route path="/contractor-register" element={<ContractorRegister />} />
            <Route path="/terms" element={<LegalPage type="terms" />} />
            <Route path="/privacy" element={<LegalPage type="privacy" />} />
            <Route path="/dashboard" element={<RoleDashboardRedirect />} />
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
            <Route path="/contractor-os" element={<ProtectedRoute allowedRoles={['contractor', 'designer', 'admin']}><ContractorOS /></ProtectedRoute>} />
            <Route path="/track-project" element={<ProtectedRoute allowedRoles={['homeowner', 'admin']}><ProjectOS /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          <ProfileSetupModal isOpen={showSetup} onClose={() => undefined} />

          <footer className="site-footer">
            <div className="container site-footer-inner">
              <div className="site-footer-brand">
                <img src={isDark ? '/logo_dark.png' : '/logo_light.png'} alt="Grihamm Logo" onError={event => { (event.target as HTMLImageElement).src = '/logo.png'; }} />
                <span>Book. Build. Track.</span>
              </div>

              <div className="site-footer-links">
                <span className="site-footer-kicker">Social</span>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
                <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
                <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</a>
              </div>

              <div className="site-footer-links">
                <span className="site-footer-kicker">Academy</span>
                <Link to="/contractor-register">Certification</Link>
                <Link to="/contractor-register">Partner onboarding</Link>
              </div>

              <div className="site-footer-links">
                <span className="site-footer-kicker">Contact</span>
                <Link to="/#contact">Contact Grihamm</Link>
                <a href="mailto:hello@grihamm.com">hello@grihamm.com</a>
              </div>
            </div>
            <div className="container site-footer-bottom">
              <span>© 2026 Grihamm. All rights reserved.</span>
              <span className="site-footer-legal">
                <Link to="/terms">Terms</Link>
                <Link to="/privacy">Privacy</Link>
              </span>
            </div>
          </footer>
        </main>
      </div>
    </Router>
  );
}

export default App;
