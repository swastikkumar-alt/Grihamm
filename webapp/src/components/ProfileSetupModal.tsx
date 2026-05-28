import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth, type UserRole } from '../contexts/AuthContext';

const ProfileSetupModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { currentUser, updateProfile } = useAuth();
  const { t } = useTranslation();
  const [occupation, setOccupation] = useState('');
  const [otherOccupation, setOtherOccupation] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const resolveRole = (value: string): UserRole => {
    if (value === 'Contractor') return 'contractor';
    if (value === 'Interior Designer') return 'designer';
    return 'homeowner';
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!currentUser) return;
    if (phone && !/^\+?[\d\s-]{7,15}$/.test(phone)) {
      setError(t('profileSetup.invalidPhone'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const finalOccupation = occupation === 'Other' ? otherOccupation : occupation;
      await updateProfile({
        occupation: finalOccupation,
        role: resolveRole(finalOccupation),
        phoneNumber: phone || undefined,
        profileCompleted: true,
      });
      onClose();
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(t('profileSetup.failed'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 5000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }} />
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          className="glass"
          style={{ width: '100%', maxWidth: '460px', padding: '3rem', position: 'relative', border: '1px solid var(--glass-border)', borderRadius: '24px' }}
        >
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', marginBottom: '0.5rem' }}>
              {t('profileSetup.title')}
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {t('profileSetup.text')}
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.6rem', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('profileSetup.occupation')}
              </label>
              <select
                required
                value={occupation}
                onChange={event => setOccupation(event.target.value)}
                style={{ width: '100%', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text)', outline: 'none', fontSize: '0.9rem' }}
              >
                <option value="">{t('profileSetup.selectOccupation')}</option>
                <option value="Customer / Property Owner">{t('profileSetup.customerOwner')}</option>
                <option value="Interior Designer">Interior Designer</option>
                <option value="Contractor">Contractor</option>
                <option value="Architect">{t('profileSetup.architect')}</option>
                <option value="Student">{t('profileSetup.student')}</option>
                <option value="Real Estate Developer">{t('profileSetup.developer')}</option>
                <option value="Other">{t('profileSetup.other')}</option>
              </select>
            </div>

            {occupation === 'Other' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                <input
                  type="text"
                  placeholder={t('profileSetup.specify')}
                  required
                  value={otherOccupation}
                  onChange={event => setOtherOccupation(event.target.value)}
                  style={{ width: '100%', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text)', outline: 'none', fontSize: '0.9rem' }}
                />
              </motion.div>
            )}

            <div>
              <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.6rem', display: 'block', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {t('profileSetup.phoneOptional')}
              </label>
              <input
                type="tel"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={event => setPhone(event.target.value)}
                style={{ width: '100%', padding: '1rem', background: 'var(--surface)', border: '1px solid var(--glass-border)', borderRadius: '10px', color: 'var(--text)', outline: 'none', fontSize: '0.9rem' }}
              />
            </div>

            {error && (
              <div style={{ color: '#ff5f56', fontSize: '0.82rem', padding: '0.8rem 1rem', background: 'rgba(255,95,86,0.08)', borderRadius: '8px', border: '1px solid rgba(255,95,86,0.2)' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '1.2rem', marginTop: '0.5rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? t('common.saving') : t('profileSetup.complete')}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ProfileSetupModal;
