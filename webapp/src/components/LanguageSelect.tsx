import { useState } from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { setAppLanguage, supportedLanguageOptions, type SupportedLanguage } from '../i18n';

type LanguageSelectProps = {
  compact?: boolean;
};

const LanguageSelect = ({ compact = false }: LanguageSelectProps) => {
  const { i18n, t } = useTranslation();
  const { currentUser, userProfile, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);

  const changeLanguage = async (language: SupportedLanguage) => {
    setSaving(true);
    try {
      await setAppLanguage(language);
      if (currentUser && userProfile?.preferredLanguage !== language) {
        await updateProfile({ preferredLanguage: language });
      }
    } catch (error) {
      console.warn('Language preference could not be saved.', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <label className={compact ? 'language-select compact' : 'language-select'}>
      <span>
        <Languages size={14} />
        {!compact && t('common.language')}
      </span>
      <select
        value={i18n.language}
        disabled={saving}
        onChange={event => void changeLanguage(event.target.value as SupportedLanguage)}
        aria-label={t('common.language')}
      >
        {supportedLanguageOptions.map(option => (
          <option key={option.code} value={option.code}>{option.nativeLabel}</option>
        ))}
      </select>
    </label>
  );
};

export default LanguageSelect;
