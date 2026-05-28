import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, ShieldCheck, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './AboutPage.css';

const AboutPage = () => {
  const { t } = useTranslation();
  const standards = t('about.standards', { returnObjects: true }) as string[];
  const trust = t('about.trust', { returnObjects: true }) as string[];

  return (
    <div className="about-page">
      <section className="about-hero container">
        <div>
          <span className="about-kicker">GRIHAMM</span>
          <h1>{t('about.title')}</h1>
          <p>{t('about.intro')}</p>
          <div className="about-actions">
            <Link className="btn-primary" to="/">{t('about.cta')}</Link>
            <Link className="btn-outline" to="/contractor-register">{t('about.partnerCta')}</Link>
          </div>
        </div>
        <aside className="about-proof-card">
          <ShieldCheck />
          <strong>{t('about.trustTitle')}</strong>
          <span>Reviewed partners. Structured briefs. Proof-led payouts.</span>
        </aside>
      </section>

      <section className="about-grid container">
        <article className="about-panel">
          <ClipboardCheck />
          <h2>{t('about.whoTitle')}</h2>
          <p>{t('about.whoText')}</p>
        </article>
        <article className="about-panel dark">
          <WalletCards />
          <h2>{t('about.visionTitle')}</h2>
          <p>{t('about.visionText')}</p>
        </article>
        <article className="about-panel wide">
          <CheckCircle2 />
          <h2>{t('about.missionTitle')}</h2>
          <p>{t('about.missionText')}</p>
        </article>
      </section>

      <section className="about-lists container">
        <div>
          <span className="about-kicker">{t('about.standardsTitle')}</span>
          {standards.map(item => <p key={item}>{item}</p>)}
        </div>
        <div>
          <span className="about-kicker">{t('about.trustTitle')}</span>
          {trust.map(item => <p key={item}>{item}</p>)}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
