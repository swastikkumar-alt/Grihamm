import { Link } from 'react-router-dom';
import { CheckCircle2, ClipboardCheck, ShieldCheck, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './AboutPage.css';

type AboutItem = {
  title: string;
  text: string;
};

const AboutPage = () => {
  const { t } = useTranslation();
  const standards = t('about.standards', { returnObjects: true }) as AboutItem[];
  const trust = t('about.trust', { returnObjects: true }) as AboutItem[];
  const pillars = t('about.pillars', { returnObjects: true }) as AboutItem[];
  const principles = t('about.principles', { returnObjects: true }) as string[];
  const pillarIcons = [ShieldCheck, ClipboardCheck, CheckCircle2, WalletCards];
  const standardIcons = [ShieldCheck, ClipboardCheck, CheckCircle2];
  const trustIcons = [WalletCards, CheckCircle2, ShieldCheck];

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
          <span>{t('about.proofText')}</span>
        </aside>
      </section>

      <section className="about-foundation container" aria-label="Grihamm foundation">
        <article className="about-panel about-panel-primary">
          <ClipboardCheck />
          <h2>{t('about.whoTitle')}</h2>
          <p>{t('about.whoText')}</p>
        </article>
        <div className="about-foundation-stack">
          <article className="about-panel dark">
            <WalletCards />
            <h2>{t('about.visionTitle')}</h2>
            <p>{t('about.visionText')}</p>
          </article>
          <article className="about-panel">
            <CheckCircle2 />
            <h2>{t('about.missionTitle')}</h2>
            <p>{t('about.missionText')}</p>
          </article>
        </div>
      </section>

      <section className="about-pillars container" aria-labelledby="about-pillars-title">
        <div className="about-section-head">
          <span className="about-kicker">{t('about.pillarsEyebrow')}</span>
          <h2 id="about-pillars-title">{t('about.pillarsTitle')}</h2>
        </div>
        <ol className="about-pillar-grid">
          {pillars.map((item, index) => {
            const Icon = pillarIcons[index % pillarIcons.length];
            return (
              <li className="about-pillar" key={item.title}>
                <Icon size={21} />
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="about-system container">
        <div className="about-system-grid">
          <div className="about-system-panel">
            <span className="about-kicker">{t('about.standardsTitle')}</span>
            <div className="about-system-list">
              {standards.map((item, index) => {
                const Icon = standardIcons[index % standardIcons.length];
                return (
                  <article className="about-system-item" key={item.title}>
                    <Icon size={20} />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
          <div className="about-system-panel dark">
            <span className="about-kicker">{t('about.trustTitle')}</span>
            <div className="about-system-list">
              {trust.map((item, index) => {
                const Icon = trustIcons[index % trustIcons.length];
                return (
                  <article className="about-system-item" key={item.title}>
                    <Icon size={20} />
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="about-close container">
        <div className="about-why">
          <div>
            <span className="about-kicker">{t('about.whyTitle')}</span>
            <p>{t('about.whyText')}</p>
          </div>
          <blockquote>{t('about.manifesto')}</blockquote>
        </div>

        <div className="about-principles" aria-labelledby="about-principles-title">
          <div className="about-section-head">
            <span className="about-kicker">{t('about.principlesEyebrow')}</span>
            <h2 id="about-principles-title">{t('about.principlesTitle')}</h2>
          </div>
          <div className="about-principle-list">
            {principles.map(item => (
              <p key={item}>
                <CheckCircle2 size={16} />
                <span>{item}</span>
              </p>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
