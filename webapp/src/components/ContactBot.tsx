import { useState, type FormEvent } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

type ContactForm = {
  name: string;
  phone: string;
  email: string;
  city: string;
  message: string;
};

const initialForm: ContactForm = {
  name: '',
  phone: '',
  email: '',
  city: '',
  message: '',
};

const ContactBot = () => {
  const { t, i18n } = useTranslation();
  const { currentUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ContactForm>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const updateField = (field: keyof ContactForm, value: string) => {
    setForm(previous => ({ ...previous, [field]: value }));
    setError('');
    setStatus('');
  };

  const toggleOpen = () => {
    const nextOpen = !open;
    if (nextOpen && currentUser) {
      setForm(previous => ({
        ...previous,
        name: previous.name || currentUser.displayName || '',
        email: previous.email || currentUser.email || '',
      }));
    }
    setOpen(nextOpen);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) {
      setError(t('contactBot.errors.name'));
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      setError(t('contactBot.errors.contact'));
      return;
    }
    if (!form.message.trim()) {
      setError(t('contactBot.errors.message'));
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await api.createContactLead({
        ...form,
        source: 'contact_bot',
        preferredLanguage: i18n.language || 'en',
      });
      setStatus(t('contactBot.success'));
      setForm({
        name: currentUser?.displayName || '',
        email: currentUser?.email || '',
        phone: '',
        city: '',
        message: '',
      });
    } catch (err) {
      console.error('Contact lead failed:', err);
      setError(t('contactBot.errors.failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="contact-bot">
      {open && (
        <section className="contact-bot-panel" aria-label={t('contactBot.eyebrow')}>
          <header>
            <div>
              <span>{t('contactBot.eyebrow')}</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label={t('common.close')}>
              <X size={17} />
            </button>
          </header>

          <div className="contact-bot-message">
            <MessageCircle size={16} />
            <p>{t('contactBot.prompt')}</p>
          </div>

          <form onSubmit={submit}>
            <label>
              <span>{t('contactBot.name')}</span>
              <input value={form.name} onChange={event => updateField('name', event.target.value)} placeholder={t('contactBot.namePlaceholder')} />
            </label>
            <div className="contact-bot-grid">
              <label>
                <span>{t('contactBot.phone')}</span>
                <input value={form.phone} onChange={event => updateField('phone', event.target.value)} placeholder="+91 98765 43210" />
              </label>
              <label>
                <span>{t('contactBot.email')}</span>
                <input type="email" value={form.email} onChange={event => updateField('email', event.target.value)} placeholder="name@example.com" />
              </label>
            </div>
            <label>
              <span>{t('contactBot.city')}</span>
              <input value={form.city} onChange={event => updateField('city', event.target.value)} placeholder={t('contactBot.cityPlaceholder')} />
            </label>
            <label>
              <span>{t('contactBot.message')}</span>
              <textarea value={form.message} onChange={event => updateField('message', event.target.value)} placeholder={t('contactBot.messagePlaceholder')} />
            </label>

            {error && <div className="contact-bot-alert error">{error}</div>}
            {status && <div className="contact-bot-alert success">{status}</div>}

            <button className="btn-primary" type="submit" disabled={submitting}>
              <Send size={15} />
              {submitting ? t('contactBot.sending') : t('contactBot.send')}
            </button>
          </form>
        </section>
      )}

      <button className="contact-bot-trigger" type="button" onClick={toggleOpen} aria-label={t('contactBot.open')}>
        {open ? <X size={21} /> : <MessageCircle size={22} />}
      </button>
    </div>
  );
};

export default ContactBot;
