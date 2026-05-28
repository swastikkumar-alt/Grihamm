import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Truck, Wrench, CheckCircle2, HardHat, Building, AlertCircle, LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AuthModal from '../components/AuthModal';
import LanguageSelect from '../components/LanguageSelect';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { partnerSpecializations, supportedCities } from '../lib/platformConfig';

interface FormData {
  // Step 1
  fullName: string;
  email: string;
  phone: string;
  companyName: string;
  professionalType: 'Interior Designer' | 'Contractor';
  city: string;
  businessAddress: string;
  // Step 2
  specializations: string[];
  experience: string;
  completedProjects: string;
  clientsServed: string;
  serviceAreas: string;
  teamSize: string;
  workCapacity: string;
  materialBrands: string;
  warrantyPolicy: string;
  priceStart: string;
  priceUnit: 'Per visit' | 'Per sqft' | 'Per project';
  paymentTerms: string;
  // Step 3
  gstin: string;
  languages: string;
  referenceProjects: string;
  insuranceCoverage: string;
  grihammCertified: boolean;
  academyCredential: string;
  portfolio: string;
  portfolioImages: string;
  uploadedPortfolioImages: string[];
  profileHeadline: string;
  profileSummary: string;
}

const ContractorRegister = () => {
  const { t } = useTranslation();
  const { currentUser, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: currentUser?.email || '',
    phone: '',
    companyName: '',
    professionalType: 'Contractor',
    city: '',
    businessAddress: '',
    specializations: [],
    experience: '1-3 Years',
    completedProjects: '',
    clientsServed: '',
    serviceAreas: '',
    teamSize: '',
    workCapacity: '',
    materialBrands: '',
    warrantyPolicy: '',
    priceStart: '',
    priceUnit: 'Per project',
    paymentTerms: 'Milestone based',
    gstin: '',
    languages: '',
    referenceProjects: '',
    insuranceCoverage: '',
    grihammCertified: false,
    academyCredential: '',
    portfolio: '',
    portfolioImages: '',
    uploadedPortfolioImages: [],
    profileHeadline: '',
    profileSummary: '',
  });

  const updateField = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations.includes(spec)
        ? prev.specializations.filter(s => s !== spec)
        : [...prev.specializations, spec]
    }));
  };

  const handlePortfolioUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const selectedFiles = Array.from(files).filter(file => file.type.startsWith('image/')).slice(0, 6);
    const images = await Promise.all(selectedFiles.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
      reader.readAsDataURL(file);
    })));
    setFormData(prev => ({
      ...prev,
      uploadedPortfolioImages: [...prev.uploadedPortfolioImages, ...images].slice(0, 6),
    }));
  };

  const validateStep1 = () => {
    if (!formData.fullName.trim()) return 'Please enter your full name.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return 'Please enter a valid email address.';
    if (!/^\+?[\d\s-]{7,15}$/.test(formData.phone)) return 'Please enter a valid phone number.';
    if (!formData.city) return 'Please choose Bengaluru or Pune.';
    if (!formData.businessAddress.trim()) return 'Please add your business address or operating base.';
    return '';
  };

  const validateStep2 = () => {
    if (formData.specializations.length === 0) return 'Please select at least one specialization.';
    if (!formData.completedProjects.trim()) return 'Please add your completed project count.';
    if (!formData.teamSize.trim()) return 'Please add your team size.';
    if (!formData.workCapacity.trim()) return 'Please add your monthly work capacity.';
    if (!formData.priceStart.trim()) return 'Please add your starting price.';
    return '';
  };

  const handleNextStep = () => {
    setError('');
    let err = '';
    if (step === 1) err = validateStep1();
    if (step === 2) err = validateStep2();
    if (err) { setError(err); return; }
    setStep(s => s + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!formData.profileHeadline.trim() || !formData.profileSummary.trim()) {
      setError('Please add a profile headline and summary for admin review.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const operationalSummary = [
        formData.profileSummary.trim(),
        '',
        'Operational details:',
        `Email: ${formData.email.trim()}`,
        `Business address: ${formData.businessAddress.trim()}`,
        `Team size: ${formData.teamSize.trim()}`,
        `Monthly capacity: ${formData.workCapacity.trim()}`,
        `Material brands/tools: ${formData.materialBrands.trim() || 'Not provided'}`,
        `Warranty/rework policy: ${formData.warrantyPolicy.trim() || 'Not provided'}`,
        `Languages: ${formData.languages.trim() || 'Not provided'}`,
        `Reference projects: ${formData.referenceProjects.trim() || 'Not provided'}`,
        `Insurance/safety coverage: ${formData.insuranceCoverage.trim() || 'Not provided'}`,
      ].join('\n');

      await api.createApplication({
        applicantUid: currentUser.uid,
        name: formData.companyName.trim() || formData.fullName.trim(),
        type: formData.professionalType,
        city: formData.city,
        phone: formData.phone,
        experience: formData.experience,
        completedProjects: Number(formData.completedProjects) || 0,
        clientsServed: Number(formData.clientsServed) || 0,
        startingPrice: Number(formData.priceStart) || 0,
        priceUnit: formData.priceUnit.toLowerCase(),
        paymentTerms: formData.paymentTerms,
        services: formData.specializations,
        serviceAreas: formData.serviceAreas
          .split(',')
          .map(area => area.trim())
          .filter(Boolean),
        businessAddress: formData.businessAddress.trim(),
        languages: formData.languages.split(',').map(item => item.trim()).filter(Boolean),
        teamSize: Number(formData.teamSize) || 0,
        monthlyCapacity: formData.workCapacity.trim(),
        materialBrands: formData.materialBrands.split(',').map(item => item.trim()).filter(Boolean),
        warrantyPolicy: formData.warrantyPolicy.trim(),
        referenceProjects: formData.referenceProjects.split('\n').map(item => item.trim()).filter(Boolean),
        insuranceCoverage: formData.insuranceCoverage.trim(),
        gstin: formData.gstin.trim(),
        grihammCertified: formData.grihammCertified,
        academyCredential: formData.academyCredential.trim(),
        portfolioImages: [
          ...formData.portfolioImages
            .split(',')
            .map(image => image.trim())
            .filter(Boolean),
          ...formData.uploadedPortfolioImages,
        ],
        portfolio: formData.portfolio,
        headline: formData.profileHeadline,
        summary: operationalSummary,
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Could not submit right now. Check your Supabase database setup and try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.85rem 0.95rem',
    background: 'var(--surface)',
    border: '1px solid var(--glass-border)',
    borderRadius: '8px',
    color: 'var(--text)',
    fontSize: '0.88rem',
    outline: 'none',
  };

  if (authLoading) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh', paddingTop: '120px' }}>
        <div className="container" style={{ maxWidth: '800px', color: 'var(--text-muted)' }}>
          {t('common.loading')}
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div style={{ background: 'var(--background)', minHeight: '100vh', paddingTop: '104px' }}>
        <div className="container" style={{ maxWidth: '820px', paddingBottom: '5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <LanguageSelect />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{
              padding: 'clamp(1.4rem, 4vw, 3rem)',
              border: '1px solid var(--glass-border)',
              borderRadius: 10,
              textAlign: 'center',
            }}
          >
            <div style={{
              width: 68,
              height: 68,
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 1.5rem',
              borderRadius: 16,
              background: 'var(--primary)',
              color: '#111',
            }}>
              <LogIn size={32} />
            </div>
            <span style={{ color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
              Partner onboarding
            </span>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 6vw, 3rem)', lineHeight: 1.08, margin: '0.8rem 0 1rem' }}>
              Login before applying to partner with Grihamm.
            </h1>
            <p style={{ maxWidth: 680, margin: '0 auto 2rem', color: 'var(--text-muted)', fontSize: '0.98rem', lineHeight: 1.7 }}>
              Contractors and interior designers need a Grihamm account before submitting GSTIN, portfolio images,
              service areas, prices, and verification details for admin review.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1rem', maxWidth: 520, margin: '0 auto' }}>
              <button className="btn-primary" style={{ padding: '1.1rem' }} onClick={() => setIsAuthModalOpen(true)}>
                {t('nav.login')}
              </button>
              <button
                style={{ padding: '1.1rem', border: '1px solid var(--glass-border)', borderRadius: 8, background: 'transparent', color: 'var(--text)', fontWeight: 800 }}
                onClick={() => { window.location.href = '/marketplace'; }}
              >
                {t('booking.tabs.contractors')}
              </button>
            </div>
          </motion.div>
        </div>
        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--background)', minHeight: '100vh', paddingTop: '104px' }}>
      <div className="container" style={{ maxWidth: '980px' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <LanguageSelect />
        </div>

        {submitted ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass"
            style={{ padding: '5rem', textAlign: 'center', border: '1px solid var(--glass-border)' }}
          >
            <div style={{ width: '100px', height: '100px', background: 'var(--primary)', borderRadius: '50%', margin: '0 auto 3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
              <CheckCircle2 size={50} />
            </div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '2.5rem', marginBottom: '1.5rem' }}>Application Received</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.7, marginBottom: '3rem' }}>
              Thank you for applying to join the Grihamm professional network. Admin will review your profile,
              GSTIN, portfolio images, service areas, and verification details before your listing goes live. You will hear from us
              within <strong style={{ color: 'var(--primary)' }}>48 hours</strong>.
            </p>
            <button className="btn-primary" onClick={() => window.location.href = '/'} style={{ padding: '1rem 2.5rem' }}>
              RETURN TO HOME
            </button>
          </motion.div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.06, marginBottom: '0.8rem' }}>
                Partner with <span style={{ color: 'var(--primary)' }}>Grihamm</span>
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.98rem', maxWidth: 720, margin: '0 auto', lineHeight: 1.7 }}>Build your approved profile for residential, corporate, retail, and commercial clients in Bengaluru and Pune.</p>
            </div>

            {/* Progress Bar */}
            <div style={{ display: 'flex', gap: '0.8rem', marginBottom: '1.5rem', alignItems: 'center' }}>
              {[1, 2, 3].map(i => (
                <React.Fragment key={i}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: i <= step ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                      color: i <= step ? '#000' : 'var(--text-muted)',
                      fontWeight: 800, fontSize: '0.85rem', flexShrink: 0, transition: '0.3s'
                    }}>
                      {i < step ? <CheckCircle2 size={16} /> : i}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: i === step ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === step ? 700 : 400 }}>
                      {i === 1 ? 'Profile Basics' : i === 2 ? 'Expertise' : 'Admin Review'}
                    </span>
                  </div>
                  {i < 3 && <div style={{ flex: 1, height: '2px', background: i < step ? 'var(--primary)' : 'rgba(255,255,255,0.05)', borderRadius: '2px', transition: '0.3s' }} />}
                </React.Fragment>
              ))}
            </div>

            <form className="glass" style={{ padding: 'clamp(1.1rem, 3vw, 2rem)', border: '1px solid var(--glass-border)', borderRadius: 10 }} onSubmit={handleSubmit}>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#ff5f56', fontSize: '0.85rem', padding: '1rem', background: 'rgba(255,95,86,0.08)', borderRadius: '10px', border: '1px solid rgba(255,95,86,0.2)', marginBottom: '1.5rem' }}
                >
                  <AlertCircle size={18} /> {error}
                </motion.div>
              )}

              {step === 1 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <Building size={20} color="var(--primary)" /> Business Information
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Full Name *</label>
                      <input type="text" required placeholder="Your legal name" value={formData.fullName} onChange={e => updateField('fullName', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Email *</label>
                      <input type="email" required placeholder="you@company.com" value={formData.email} onChange={e => updateField('email', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Phone Number *</label>
                      <input type="tel" required placeholder="+91 98765 43210" value={formData.phone} onChange={e => updateField('phone', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Company Name</label>
                      <input type="text" placeholder="Registered business name" value={formData.companyName} onChange={e => updateField('companyName', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Professional Type *</label>
                      <select value={formData.professionalType} onChange={e => updateField('professionalType', e.target.value as FormData['professionalType'])} style={inputStyle}>
                        <option>Contractor</option>
                        <option>Interior Designer</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem', marginBottom: '1.4rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>City *</label>
                      <select value={formData.city} onChange={e => updateField('city', e.target.value as FormData['city'])} style={inputStyle}>
                        <option value="">Select city</option>
                        {supportedCities.map(item => <option key={item}>{item}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Business Address / Operating Base *</label>
                      <input type="text" required placeholder="Area, city, landmark" value={formData.businessAddress} onChange={e => updateField('businessAddress', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <button type="button" className="btn-primary" style={{ width: '100%', padding: '1.2rem' }} onClick={handleNextStep}>
                    NEXT STEP
                  </button>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <HardHat size={20} color="var(--primary)" /> Specialization & Experience
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {partnerSpecializations.map(opt => (
                      <label key={opt} style={{ padding: '1rem', border: `1px solid ${formData.specializations.includes(opt) ? 'var(--primary)' : 'var(--glass-border)'}`, borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'border-color 0.2s', background: formData.specializations.includes(opt) ? 'rgba(194,178,128,0.08)' : 'transparent' }}>
                        <input type="checkbox" checked={formData.specializations.includes(opt)} onChange={() => toggleSpecialization(opt)} style={{ accentColor: 'var(--primary)', width: '16px', height: '16px' }} />
                        <span style={{ fontSize: '0.9rem', color: formData.specializations.includes(opt) ? 'var(--primary)' : 'var(--text)', fontWeight: formData.specializations.includes(opt) ? 600 : 400 }}>{opt}</span>
                      </label>
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Years of Experience *</label>
                      <select value={formData.experience} onChange={e => updateField('experience', e.target.value)} style={{ ...inputStyle }}>
                        <option>1-3 Years</option>
                        <option>3-5 Years</option>
                        <option>5-10 Years</option>
                        <option>10+ Years</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Projects *</label>
                      <input type="number" min="0" placeholder="e.g. 42" value={formData.completedProjects} onChange={e => updateField('completedProjects', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Clients Served on Grihamm / Similar Platforms</label>
                      <input type="number" min="0" placeholder="e.g. 18" value={formData.clientsServed} onChange={e => updateField('clientsServed', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Team Size *</label>
                      <input type="number" min="1" placeholder="e.g. 12" value={formData.teamSize} onChange={e => updateField('teamSize', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Service Areas</label>
                      <input type="text" placeholder="e.g. Whitefield, HSR Layout, Kharadi, Baner" value={formData.serviceAreas} onChange={e => updateField('serviceAreas', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Work Capacity *</label>
                      <input type="text" placeholder="e.g. 2 turnkey sites or 6 service jobs" value={formData.workCapacity} onChange={e => updateField('workCapacity', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Starting Price *</label>
                      <input type="number" min="0" placeholder="e.g. 25000" value={formData.priceStart} onChange={e => updateField('priceStart', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Pricing Unit *</label>
                      <select value={formData.priceUnit} onChange={e => updateField('priceUnit', e.target.value as FormData['priceUnit'])} style={inputStyle}>
                        <option>Per project</option>
                        <option>Per sqft</option>
                        <option>Per visit</option>
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Payment Terms</label>
                      <input type="text" placeholder="e.g. 20% advance, remaining by milestones" value={formData.paymentTerms} onChange={e => updateField('paymentTerms', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Preferred Material Brands / Tools</label>
                      <input type="text" placeholder="e.g. Ebco, Hettich, Asian Paints, Kajaria" value={formData.materialBrands} onChange={e => updateField('materialBrands', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Warranty / Rework Policy</label>
                      <input type="text" placeholder="e.g. 30-day snag support, 1-year workmanship" value={formData.warrantyPolicy} onChange={e => updateField('warrantyPolicy', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <button type="button" style={{ flex: 1, padding: '1.2rem', background: 'transparent', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontWeight: 600 }} onClick={() => { setError(''); setStep(1); }}>BACK</button>
                    <button type="button" className="btn-primary" style={{ flex: 1, padding: '1.2rem' }} onClick={handleNextStep}>NEXT STEP</button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <ShieldCheck size={20} color="var(--primary)" /> Final Verification
                  </h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Languages Spoken</label>
                      <input type="text" placeholder="e.g. Kannada, Hindi, English, Marathi" value={formData.languages} onChange={e => updateField('languages', e.target.value)} style={inputStyle} />
                    </div>
                    <div>
                      <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Insurance / Safety Coverage</label>
                      <input type="text" placeholder="e.g. worker insurance, PPE process, none" value={formData.insuranceCoverage} onChange={e => updateField('insuranceCoverage', e.target.value)} style={inputStyle} />
                    </div>
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Reference Projects</label>
                    <textarea placeholder="Add 2-3 reference projects with location, scope, value, and contact/referee if available." value={formData.referenceProjects} onChange={e => updateField('referenceProjects', e.target.value)} style={{ ...inputStyle, minHeight: '92px', resize: 'vertical' }} />
                  </div>
                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>GSTIN</label>
                    <input type="text" placeholder="e.g. 29ABCDE1234F1Z5" value={formData.gstin} onChange={e => updateField('gstin', e.target.value.toUpperCase())} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: 10, background: 'rgba(194,178,128,0.06)' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: 'var(--text)', fontWeight: 700, marginBottom: '0.9rem' }}>
                      <input type="checkbox" checked={formData.grihammCertified} onChange={e => updateField('grihammCertified', e.target.checked)} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                      Completed a Grihamm Academy course or certificate
                    </label>
                    <input
                      type="text"
                      placeholder="Certificate/course name or ID"
                      value={formData.academyCredential}
                      onChange={e => updateField('academyCredential', e.target.value)}
                      style={inputStyle}
                    />
                    <p style={{ marginTop: '0.7rem', color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1.6 }}>
                      Admin will verify this before showing the Grihamm Certified badge publicly.
                    </p>
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Portfolio / Website Link</label>
                    <input type="url" placeholder="https://yourportfolio.com" value={formData.portfolio} onChange={e => updateField('portfolio', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Past Work Image URLs</label>
                    <textarea placeholder="Paste image links separated by comma. Local file upload will connect to Azure storage later." value={formData.portfolioImages} onChange={e => updateField('portfolioImages', e.target.value)} style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} />
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Upload Past Work Images</label>
                    <input type="file" accept="image/*" multiple onChange={e => void handlePortfolioUpload(e.target.files)} style={inputStyle} />
                    {formData.uploadedPortfolioImages.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(86px, 1fr))', gap: '0.7rem', marginTop: '0.9rem' }}>
                        {formData.uploadedPortfolioImages.map((image, index) => (
                          <img key={`${image.slice(0, 30)}-${index}`} src={image} alt={`Uploaded work ${index + 1}`} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Profile Headline *</label>
                    <input type="text" placeholder="e.g. Modular kitchen contractor with 10+ years experience" value={formData.profileHeadline} onChange={e => updateField('profileHeadline', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ marginBottom: '2.5rem' }}>
                    <label style={{ display: 'block', marginBottom: '0.6rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>Profile Summary *</label>
                    <textarea placeholder="Describe your best work, team strength, service quality, and what customers should know before booking you." value={formData.profileSummary} onChange={e => updateField('profileSummary', e.target.value)} style={{ ...inputStyle, minHeight: '130px', resize: 'vertical' }} />
                  </div>
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <button type="button" style={{ flex: 1, padding: '1.2rem', background: 'transparent', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: '8px', fontWeight: 600 }} onClick={() => { setError(''); setStep(2); }}>BACK</button>
                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '1.2rem', opacity: loading ? 0.7 : 1 }} disabled={loading}>
                      {loading ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
                    </button>
                  </div>
                </motion.div>
              )}
            </form>
          </div>
        )}

        {/* Value Props */}
        {!submitted && (
          <div style={{ marginTop: '6rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '2rem', paddingBottom: '6rem' }}>
            {[
              { icon: <Truck />, title: "Verified Demand", desc: "Residential, corporate, retail, and commercial clients can discover your profile and book the right specialist." },
              { icon: <ShieldCheck />, title: "Admin Approval", desc: "Profiles go live only after Grihamm checks GSTIN, portfolio images, city coverage, and work quality." },
              { icon: <Wrench />, title: "Managed Projects", desc: "Approved professionals work with PM tracking, milestone payments, and documented site updates." }
            ].map((feature, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}>{feature.icon}</div>
                <h4 style={{ marginBottom: '1rem' }}>{feature.title}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.7 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContractorRegister;
