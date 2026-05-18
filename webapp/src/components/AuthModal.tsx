import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LogIn } from 'lucide-react';
import { SUPER_ADMIN_EMAIL, useAuth, type UserRole } from '../contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { login, loginAsRole, isFirebaseConfigured } = useAuth();
  const [localEmail, setLocalEmail] = useState('');

  const handleGoogleLogin = async () => {
    await login();
    onClose();
  };

  const handleLocalLogin = async (role: UserRole) => {
    await loginAsRole(role, localEmail);
    onClose();
  };

  const localRoles: { role: UserRole; label: string; detail: string }[] = [
    { role: 'homeowner', label: 'Customer', detail: 'Book services and track site work' },
    { role: 'contractor', label: 'Partner', detail: 'Upload progress and respond to remarks' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem'
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'rgba(0,0,0,0.8)',
              backdropFilter: 'blur(8px)'
            }}
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass"
            style={{
              width: '100%',
              maxWidth: '450px',
              padding: '3rem',
              position: 'relative',
              textAlign: 'center',
              border: '1px solid var(--glass-border)',
              background: 'var(--surface)'
            }}
          >
            <button 
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '1.5rem',
                right: '1.5rem',
                background: 'transparent',
                color: 'var(--text-muted)'
              }}
            >
              <X size={24} />
            </button>

            <div style={{ marginBottom: '2.5rem' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                background: 'var(--primary)', 
                borderRadius: '16px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                margin: '0 auto 1.5rem',
                boxShadow: '0 8px 24px rgba(194, 178, 128, 0.3)'
              }}>
                <LogIn size={32} color="#fff" />
              </div>
              <h2 style={{ fontSize: '2rem', fontFamily: 'var(--font-serif)', marginBottom: '0.5rem' }}>Welcome to Grihamm</h2>
              <p style={{ color: 'var(--text-muted)' }}>Choose how you want to continue.</p>
            </div>

            {isFirebaseConfigured ? (
              <button
                onClick={handleGoogleLogin}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#000',
                  fontWeight: 700,
                  fontSize: '1rem',
                  border: '1px solid #ddd',
                  marginBottom: '1.5rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}
              >
                <LogIn size={20} />
                Continue with Google
              </button>
            ) : (
              <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '1.5rem' }}>
                <input
                  type="email"
                  value={localEmail}
                  onChange={event => setLocalEmail(event.target.value)}
                  placeholder="Email address"
                  style={{
                    width: '100%',
                    padding: '1rem',
                    borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)',
                    color: 'var(--text)',
                    border: '1px solid var(--glass-border)',
                    outline: 'none',
                  }}
                />
                {localRoles.map(item => (
                  <button
                    key={item.role}
                    onClick={() => handleLocalLogin(item.role)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '1rem',
                      borderRadius: '10px',
                      background: 'rgba(255,255,255,0.04)',
                      color: 'var(--text)',
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <span style={{ display: 'block', fontWeight: 800, marginBottom: '0.25rem' }}>{item.label}</span>
                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{item.detail}</span>
                  </button>
                ))}
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.76rem', lineHeight: 1.5 }}>
                  Admin access is granted only to {SUPER_ADMIN_EMAIL}.
                </p>
              </div>
            )}

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              By continuing, you agree to Grihamm's Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AuthModal;
