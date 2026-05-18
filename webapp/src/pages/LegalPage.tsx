import { Link } from 'react-router-dom';
import './LegalPage.css';

type LegalPageType = 'terms' | 'privacy';

interface LegalPageProps {
  type: LegalPageType;
}

const legalContent: Record<LegalPageType, {
  kicker: string;
  title: string;
  intro: string;
  sections: { title: string; text: string }[];
}> = {
  terms: {
    kicker: 'Terms of service',
    title: 'Grihamm platform terms',
    intro: 'These terms explain how customers, contractors, interior designers, and Grihamm operations should use the platform.',
    sections: [
      {
        title: 'Platform role',
        text: 'Grihamm helps customers discover verified professionals, request services, track project progress, leave remarks, and request site audits. Approved professionals are responsible for keeping their profile, prices, GSTIN, portfolio, and site updates accurate.',
      },
      {
        title: 'Bookings and service delivery',
        text: 'A booking request records the selected property type, city, budget, area, professional, and project scope. Final scope, commercial terms, milestone payments, and handover conditions should be confirmed before execution starts.',
      },
      {
        title: 'Professional listings',
        text: 'Contractors and interior designers must submit truthful business information, work images, service areas, starting prices, and verification details. Grihamm may approve, reject, pause, or remove listings if information is inaccurate or work quality is disputed.',
      },
      {
        title: 'Site audits',
        text: 'Customers can request a Grihamm site audit for Rs 999. Audit findings are based on visible site conditions, submitted scope, and evidence available during the visit. An audit does not replace statutory, structural, legal, or government approvals.',
      },
      {
        title: 'Acceptable use',
        text: 'Users must not upload false information, misuse another user account, bypass login requirements, harass customers or professionals, or submit illegal, unsafe, or misleading project requests.',
      },
    ],
  },
  privacy: {
    kicker: 'Privacy policy',
    title: 'How Grihamm handles data',
    intro: 'This policy explains the practical data Grihamm collects to run bookings, professional profiles, project tracking, remarks, and audits.',
    sections: [
      {
        title: 'Information we collect',
        text: 'We may collect account details, email, phone number, role, property requirements, booking details, project updates, remarks, GSTIN, service areas, prices, portfolio images, audit requests, and operational notes.',
      },
      {
        title: 'How we use information',
        text: 'Data is used to authenticate users, match customers with professionals, review partner applications, run project dashboards, document site progress, support audits, and maintain platform quality.',
      },
      {
        title: 'Sharing',
        text: 'Relevant project, booking, contact, and scope details may be shared between the customer, assigned professional, and Grihamm operations team so the service can be delivered and tracked.',
      },
      {
        title: 'Storage and security',
        text: 'Platform data is stored in Supabase, while Google sign-in is handled through Firebase Auth. Access controls, backups, and operational monitoring should be reviewed before production launch.',
      },
      {
        title: 'User requests',
        text: 'Users can request correction or review of profile, booking, or project information through Grihamm support channels. Some records may need to be retained for operational, audit, dispute, or legal reasons.',
      },
    ],
  },
};

const LegalPage = ({ type }: LegalPageProps) => {
  const content = legalContent[type];

  return (
    <div className="legal-page">
      <section className="legal-hero">
        <span className="legal-kicker">{content.kicker}</span>
        <h1>{content.title}</h1>
        <p>{content.intro}</p>
      </section>

      <section className="legal-card">
        <div className="legal-updated">Last updated: 16 May 2026</div>
        {content.sections.map(section => (
          <article key={section.title} className="legal-section">
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </article>
        ))}
        <div className="legal-actions">
          <Link className="btn-primary" to="/marketplace">Find services</Link>
          <Link className="btn-outline" to="/">Back to home</Link>
        </div>
      </section>
    </div>
  );
};

export default LegalPage;
