import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Navbar from './components/Navbar';
import ContactBot from './components/ContactBot';
import ProfileSetupModal from './components/ProfileSetupModal';
import { useAuth } from './contexts/AuthContext';
import { isSupportedLanguage, setAppLanguage } from './i18n';

const Admin = lazy(() => import('./pages/Admin'));
const ProjectOS = lazy(() => import('./pages/ProjectOS'));
const ContractorRegister = lazy(() => import('./pages/ContractorRegister'));
const ContractorOS = lazy(() => import('./pages/ContractorOS'));
const MvpPrototype = lazy(() => import('./pages/MvpPrototype'));
const LegalPage = lazy(() => import('./pages/LegalPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

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
  const { t } = useTranslation();
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const { userProfile, currentUser } = useAuth();
  const showSetup = Boolean(currentUser && userProfile && !userProfile.profileCompleted && userProfile.role !== 'admin');

  React.useLayoutEffect(() => {
    document.body.classList.toggle('dark-mode', isDark);
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  React.useEffect(() => {
    if (isSupportedLanguage(userProfile?.preferredLanguage)) {
      void setAppLanguage(userProfile.preferredLanguage);
    }
  }, [userProfile?.preferredLanguage]);

  const toggleTheme = () => {
    setIsDark(prev => !prev);
  };

  return (
    <Router>
      <div className="app">
        <Navbar isDark={isDark} toggleTheme={toggleTheme} />
        <main>
          <Suspense fallback={<div className="route-loading">{t('common.loading')}</div>}>
            <Routes>
              <Route path="/" element={<MvpPrototype />} />
              <Route path="/marketplace" element={<Navigate to="/" replace />} />
              <Route path="/brand" element={<Navigate to="/" replace />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contractor-register" element={<ContractorRegister />} />
              <Route path="/terms" element={<LegalPage type="terms" />} />
              <Route path="/privacy" element={<LegalPage type="privacy" />} />
              <Route path="/dashboard" element={<RoleDashboardRedirect />} />
              <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><Admin /></ProtectedRoute>} />
              <Route path="/contractor-os" element={<ProtectedRoute allowedRoles={['contractor', 'designer', 'admin']}><ContractorOS /></ProtectedRoute>} />
              <Route path="/track-project" element={<ProtectedRoute allowedRoles={['homeowner', 'admin']}><ProjectOS /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>

          <ProfileSetupModal isOpen={showSetup} onClose={() => undefined} />

          <section className="site-partner-band">
            <div className="container site-partner-band-inner">
              <div className="site-partner-copy">
                <span className="site-footer-kicker">Partner network</span>
                <h2>{t('nav.partnerBandTitle')}</h2>
                <p>
                  {t('nav.partnerBandText')}
                </p>
              </div>
              <Link className="btn-primary" to="/contractor-register">{t('nav.partnerBandCta')}</Link>
            </div>
          </section>

          <footer className="site-footer">
            <div className="container site-footer-inner">
              <div className="site-footer-brand">
                <img src="/logo.png" alt="Grihamm Logo" />
                <span>Book. Build. Track.</span>
              </div>

              <div className="site-footer-links">
                <span className="site-footer-kicker">{t('nav.footerSocial')}</span>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">Instagram</a>
                <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a>
                <a href="https://www.youtube.com/" target="_blank" rel="noreferrer">YouTube</a>
              </div>

              <div className="site-footer-links">
                <span className="site-footer-kicker">{t('nav.footerStandards')}</span>
                <span>{t('nav.footerCertification')}</span>
                <span>{t('nav.footerAudits')}</span>
              </div>

              <div id="contact" className="site-footer-links">
                <span className="site-footer-kicker">{t('nav.footerContact')}</span>
                <Link to="/#contact">Contact Grihamm</Link>
                <a href="tel:+918867683286">{t('nav.callGrihamm')}: +91 88676 83286</a>
                <a href="mailto:hello@grihamm.com">{t('nav.emailGrihamm')}: hello@grihamm.com</a>
              </div>
            </div>
            <div className="container site-footer-bottom">
              <span>{t('nav.footerRights')}</span>
              <span className="site-footer-legal">
                <Link to="/terms">{t('nav.terms')}</Link>
                <Link to="/privacy">{t('nav.privacy')}</Link>
              </span>
            </div>
          </footer>
        </main>
        <ContactBot />
      </div>
    </Router>
  );
}

export default App;
