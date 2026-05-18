import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeIndianRupee,
  Building2,
  Camera,
  CheckCircle2,
  Compass,
  MessageSquareText,
  Paintbrush,
  Ruler,
  ShieldCheck,
  Sofa,
  Sparkles,
} from 'lucide-react';
import './HomePage.css';
import { propertyCategories } from '../lib/platformConfig';
import { useGrihammData } from '../lib/useGrihammData';

/* ── scroll reveal hook ─────────────── */
const useReveal = () => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' },
    );

    const container = ref.current;
    if (container) {
      container.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    }
    return () => observer.disconnect();
  }, []);

  return ref;
};

/* ── data ───────────────────────────── */
const workflow = [
  {
    icon: Compass,
    step: '01',
    title: 'Share your brief',
    text: 'Tell us your property type, location, budget, and scope. We match you with verified professionals.',
  },
  {
    icon: Paintbrush,
    step: '02',
    title: 'Design & execute',
    text: 'Your assigned designer and contractor manage the entire project with daily progress updates.',
  },
  {
    icon: ShieldCheck,
    step: '03',
    title: 'Track & verify',
    text: 'Monitor milestones, review site photos, and request audits — all from one dashboard.',
  },
];

const highlights = [
  { icon: BadgeIndianRupee, title: 'Transparent pricing', text: 'See clear rates before you commit — no hidden costs.' },
  { icon: Camera, title: 'Visual proof', text: 'Daily site photos and portfolio showcase from every professional.' },
  { icon: MessageSquareText, title: 'Live remarks', text: 'Comments and reviews stay tied to each project update.' },
  { icon: ShieldCheck, title: 'Admin audit layer', text: 'Independent quality checks and milestone approvals.' },
];

const HomePage = () => {
  const pageRef = useReveal();
  const { data } = useGrihammData();
  const listedProfessionals = data?.professionals.filter(item => item.status === 'listed') || [];
  const services = Array.from(new Set(listedProfessionals.flatMap(item => item.services))).slice(0, 6);
  const propertyTypes = propertyCategories.filter(item => item.id !== 'all').map(item => item.label);

  const trustPoints = [
    { label: 'Verified Pros', value: String(listedProfessionals.length || '—') },
    { label: 'Active Projects', value: String(data?.projects.length || '—') },
    { label: 'Open Remarks', value: String(data?.remarks.filter(item => item.status === 'open').length || '—') },
  ];

  return (
    <div className="home-page" ref={pageRef}>
      {/* ═══════ HERO ═══════ */}
      <section className="home-hero">
        <div className="home-hero-bg" aria-hidden="true" />
        <div className="home-hero-overlay" />

        {/* Floating accent shapes */}
        <div className="home-hero-shape home-hero-shape-1" aria-hidden="true" />
        <div className="home-hero-shape home-hero-shape-2" aria-hidden="true" />

        <div className="home-hero-content">
          <span className="home-hero-badge reveal">Interior Execution Platform</span>

          <h1 className="home-hero-title reveal reveal-delay-1">
            <span className="home-hero-title-line">Luxury interiors,</span>
            <span className="home-hero-title-line home-hero-title-accent">delivered right.</span>
          </h1>

          <p className="home-hero-subtitle reveal reveal-delay-2">
            Book verified designers and contractors. Track every milestone.
            <br className="hide-mobile" />
            From concept to handover — one platform.
          </p>

          <div className="home-hero-actions reveal reveal-delay-3">
            <Link className="home-btn home-btn-gold" to="/marketplace">
              Explore services <ArrowRight size={16} />
            </Link>
            <Link className="home-btn home-btn-glass" to="/contractor-register">
              Join as professional
            </Link>
          </div>

          {/* Trust strip */}
          <div className="home-hero-trust reveal reveal-delay-4">
            {trustPoints.map(point => (
              <div className="home-hero-trust-item" key={point.label}>
                <strong>{point.value}</strong>
                <span>{point.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ MARQUEE STRIP ═══════ */}
      <section className="home-marquee" aria-hidden="true">
        <div className="home-marquee-track">
          {[...Array(2)].map((_, i) => (
            <div className="home-marquee-group" key={i}>
              {['Design', 'Build', 'Track', 'Verify', 'Transform', 'Deliver'].map(word => (
                <span key={word + i}>
                  <Sparkles size={14} /> {word}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="home-section">
        <div className="home-section-head reveal">
          <span className="kicker">How it works</span>
          <h2>Three steps to your dream space</h2>
          <p>From your first inquiry to final handover — a clear, accountable process.</p>
        </div>
        <div className="home-workflow-grid stagger-children">
          {workflow.map(item => (
            <article className="home-workflow-card reveal" key={item.step}>
              <span className="home-workflow-step">{item.step}</span>
              <div className="home-workflow-icon">
                <item.icon size={24} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ═══════ SERVICES ═══════ */}
      <section className="home-section home-services-section">
        <div className="home-section-head reveal">
          <span className="kicker">What we cover</span>
          <h2>Every space, every scope</h2>
          <p>Residential, commercial, retail, clinics, studios — we handle the full execution lifecycle.</p>
        </div>
        <div className="home-service-columns">
          <div className="home-service-column reveal">
            <div className="home-service-column-header">
              <Building2 size={18} />
              <h3>Property types</h3>
            </div>
            <div className="home-property-grid">
              {propertyTypes.map(type => (
                <div className="home-service-chip" key={type}>
                  {type}
                </div>
              ))}
            </div>
          </div>
          <div className="home-service-column reveal reveal-delay-1">
            <div className="home-service-column-header">
              <Ruler size={18} />
              <h3>Service scope</h3>
            </div>
            <div className="home-service-grid">
              {services.map(svc => (
                <div className="home-service-chip" key={svc}>
                  <CheckCircle2 size={13} /> {svc}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ WHY GRIHAMM ═══════ */}
      <section className="home-section home-highlights-section">
        <div className="home-section-head reveal">
          <span className="kicker">Why Grihamm</span>
          <h2>Built for trust & transparency</h2>
        </div>
        <div className="home-highlights-grid stagger-children">
          {highlights.map(item => (
            <div className="home-highlight-card reveal" key={item.title}>
              <div className="home-highlight-icon">
                <item.icon size={22} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section id="contact" className="home-cta reveal">
        <div className="home-cta-inner">
          <div>
            <span className="kicker">Get started</span>
            <h2>Ready to transform your space?</h2>
            <p>Book a service or apply as a verified professional — your journey starts here.</p>
          </div>
          <div className="home-cta-actions">
            <Link className="home-btn home-btn-gold" to="/marketplace">
              Book a service
            </Link>
            <Link className="home-btn home-btn-outline" to="/contractor-register">
              Apply as professional
            </Link>
          </div>
        </div>
        <Sofa className="home-cta-watermark" aria-hidden="true" />
      </section>
    </div>
  );
};

export default HomePage;
