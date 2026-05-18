import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BadgeIndianRupee,
  Briefcase,
  Camera,
  ClipboardCheck,
  MessageSquareText,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { api, formatCurrency, type ProfessionalType } from '../lib/api';
import { supportedCities } from '../lib/platformConfig';
import { useGrihammData } from '../lib/useGrihammData';
import './Dashboard.css';

type AdminTab = 'projects' | 'professionals' | 'applications' | 'updates' | 'audits';

const Admin = () => {
  const { data, loading, error, replaceData } = useGrihammData();
  const [activeTab, setActiveTab] = useState<AdminTab>('projects');
  const [notice, setNotice] = useState('');
  const [certificationDrafts, setCertificationDrafts] = useState<Record<string, string>>({});
  const [professionalForm, setProfessionalForm] = useState({
    name: '',
    type: 'Contractor' as ProfessionalType,
    city: supportedCities[0],
    phone: '',
    experienceYears: 0,
    clientsServed: 0,
    gstin: '',
    grihammCertified: false,
    academyCredential: '',
    startingPrice: 0,
    priceUnit: 'per project',
    servicesText: '',
    serviceAreasText: '',
    portfolioImagesText: '',
    bio: '',
  });

  const professionalsById = new Map((data?.professionals || []).map(item => [item.id, item]));
  const contractors = data?.professionals.filter(item => item.type === 'Contractor' && item.status === 'listed') || [];
  const openRemarks = data?.remarks.filter(item => item.status === 'open').length || 0;

  const stats = [
    { label: 'Projects', value: data?.projects.length || 0, icon: <Briefcase /> },
    { label: 'Listed professionals', value: data?.professionals.filter(item => item.status === 'listed').length || 0, icon: <ShieldCheck /> },
    { label: 'Applications pending', value: data?.applications.filter(item => item.status === 'pending').length || 0, icon: <UserRoundCheck /> },
    { label: 'Open remarks', value: openRemarks, icon: <MessageSquareText /> },
  ];

  const serviceOptions = useMemo(() => Array.from(new Set((data?.professionals || []).flatMap(item => item.services))).slice(0, 10), [data?.professionals]);

  const updateApplication = async (id: string, status: 'approved' | 'rejected') => {
    const nextData = await api.updateApplicationStatus(id, status);
    replaceData(nextData);
    setNotice(status === 'approved' ? 'Application approved and listed.' : 'Application rejected.');
  };

  const toggleProfessional = async (id: string, status: 'listed' | 'paused') => {
    const nextData = await api.updateProfessionalStatus(id, status);
    replaceData(nextData);
    setNotice(status === 'listed' ? 'Professional is visible in marketplace.' : 'Professional paused from marketplace.');
  };

  const updateCertification = async (id: string, grihammCertified: boolean, academyCredential: string) => {
    const nextData = await api.updateProfessionalCertification(id, grihammCertified, academyCredential);
    replaceData(nextData);
    setCertificationDrafts(prev => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setNotice(grihammCertified ? 'Grihamm certification badge enabled.' : 'Grihamm certification badge removed.');
  };

  const assignContractor = async (projectId: string, contractorId: string) => {
    if (!contractorId) return;
    const nextData = await api.assignContractor(projectId, contractorId);
    replaceData(nextData);
    setNotice('Contractor assigned to project.');
  };

  const updateAudit = async (id: string, status: string) => {
    const nextData = await api.updateAuditStatus(id, status);
    replaceData(nextData);
    setNotice('Audit status updated.');
  };

  const addProfessional = async () => {
    if (!professionalForm.name.trim() || !professionalForm.phone.trim()) {
      setNotice('Name and phone are required.');
      return;
    }

    const nextData = await api.createProfessional({
      name: professionalForm.name,
      type: professionalForm.type,
      city: professionalForm.city,
      phone: professionalForm.phone,
      experienceYears: professionalForm.experienceYears,
      clientsServed: professionalForm.clientsServed,
      gstin: professionalForm.gstin,
      grihammCertified: professionalForm.grihammCertified,
      academyCredential: professionalForm.academyCredential,
      startingPrice: professionalForm.startingPrice,
      priceUnit: professionalForm.priceUnit,
      services: professionalForm.servicesText.split(',').map(item => item.trim()).filter(Boolean),
      serviceAreas: professionalForm.serviceAreasText.split(',').map(item => item.trim()).filter(Boolean),
      portfolioImages: professionalForm.portfolioImagesText.split(',').map(item => item.trim()).filter(Boolean),
      bio: professionalForm.bio,
    });
    replaceData(nextData);
    setProfessionalForm({
      name: '',
      type: 'Contractor',
      city: supportedCities[0],
      phone: '',
      experienceYears: 0,
      clientsServed: 0,
      gstin: '',
      grihammCertified: false,
      academyCredential: '',
      startingPrice: 0,
      priceUnit: 'per project',
      servicesText: '',
      serviceAreasText: '',
      portfolioImagesText: '',
      bio: '',
    });
    setNotice('Professional added and listed.');
  };

  return (
    <div className="dashboard-shell" style={{ background: 'var(--background)', minHeight: '100vh', padding: '110px 0 60px' }}>
      <div className="container">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end', gap: '2rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div>
            <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Admin operations</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', letterSpacing: 0 }}>Control quality, assignments, and audits.</h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: 780, lineHeight: 1.7 }}>Admin should see the marketplace supply, pending applications, project delivery state, remarks, and paid audit requests from a single operations console.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {[
              ['projects', 'Projects'],
              ['professionals', 'Professionals'],
              ['applications', 'Applications'],
              ['updates', 'Updates'],
              ['audits', 'Audits'],
            ].map(([id, label]) => (
              <button key={id} onClick={() => setActiveTab(id as AdminTab)} style={tabStyle(activeTab === id)}>{label}</button>
            ))}
          </div>
        </div>

        {error && <div style={{ padding: '1rem', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8 }}>Check your Supabase environment variables and run the Supabase migration. {error}</div>}
        {loading && <div className="glass" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>Loading operations data...</div>}
        {notice && <div style={{ marginBottom: '1rem', color: 'var(--primary)', fontWeight: 900 }}>{notice}</div>}

        {data && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(210px,1fr))', gap: '1rem', marginBottom: '2rem' }}>
              {stats.map(stat => (
                <div key={stat.label} className="glass" style={{ padding: '1.3rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                  <div style={{ color: 'var(--primary)', marginBottom: '0.9rem' }}>{stat.icon}</div>
                  <strong style={{ fontSize: '1.8rem' }}>{stat.value}</strong>
                  <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.86rem' }}>{stat.label}</span>
                </div>
              ))}
            </div>

            {activeTab === 'projects' && (
              <section className="glass dashboard-panel" style={panelStyle}>
                <h2 style={sectionTitle}>Projects</h2>
                <div style={{ overflowX: 'auto' }}>
                  <table className="dashboard-table" style={tableStyle}>
                    <thead><tr>{['Project', 'Customer', 'Team', 'Progress', 'Assign contractor'].map(head => <th key={head}>{head}</th>)}</tr></thead>
                    <tbody>
                      {data.projects.map(project => (
                        <tr key={project.id}>
                          <td><strong>{project.id}</strong><span>{project.homeType} - {project.city}</span></td>
                          <td>{project.customerName}</td>
                          <td>
                            <span>Designer: {professionalsById.get(project.designerId || '')?.name || 'Not assigned'}</span>
                            <span>Contractor: {professionalsById.get(project.contractorId || '')?.name || 'Not assigned'}</span>
                          </td>
                          <td><strong>{project.progress}%</strong><span>{project.stage}</span></td>
                          <td>
                            <select defaultValue={project.contractorId || ''} onChange={event => void assignContractor(project.id, event.target.value)} style={inputStyle}>
                              <option value="">Choose contractor</option>
                              {contractors.map(contractor => <option key={contractor.id} value={contractor.id}>{contractor.name}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'professionals' && (
              <div className="admin-supply-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 340px', gap: '1.5rem', alignItems: 'start' }}>
                <section className="glass dashboard-panel" style={panelStyle}>
                  <h2 style={sectionTitle}>Marketplace Supply</h2>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {data.professionals.map(pro => (
                      <div key={pro.id} className="dashboard-row-card" style={rowCardStyle}>
                        <div>
                          <strong>{pro.name}</strong>
                          <span>{pro.type} - {pro.city} - {formatCurrency(pro.startingPrice)} {pro.priceUnit}</span>
                          <span>{pro.clientsServed} Grihamm clients - GSTIN {pro.gstin || 'not added'}</span>
                          <span>{pro.grihammCertified ? `Grihamm Certified - ${pro.academyCredential || 'Academy verified'}` : 'Grihamm certification not enabled'}</span>
                          <span>{pro.services.join(', ')}</span>
                          {pro.portfolioImages.length > 0 && (
                            <span>{pro.portfolioImages.length} showcase image{pro.portfolioImages.length === 1 ? '' : 's'} uploaded</span>
                          )}
                        </div>
                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                          <input
                            style={{ ...inputStyle, minWidth: 220 }}
                            placeholder="Academy certificate/course"
                            value={certificationDrafts[pro.id] ?? pro.academyCredential}
                            onChange={event => setCertificationDrafts(prev => ({ ...prev, [pro.id]: event.target.value }))}
                          />
                          <button className="btn-outline" style={{ borderRadius: 8 }} onClick={() => void toggleProfessional(pro.id, pro.status === 'listed' ? 'paused' : 'listed')}>
                            {pro.status === 'listed' ? 'Pause' : 'List'}
                          </button>
                          <button
                            className="btn-primary"
                            style={{ borderRadius: 8, padding: '0.8rem 1rem' }}
                            onClick={() => void updateCertification(pro.id, true, (certificationDrafts[pro.id] ?? pro.academyCredential) || 'Grihamm Academy verified')}
                          >
                            {pro.grihammCertified ? 'Save certificate' : 'Mark certified'}
                          </button>
                          {pro.grihammCertified && (
                            <button
                              className="btn-outline"
                              style={{ borderRadius: 8, color: '#ff5f56' }}
                              onClick={() => void updateCertification(pro.id, false, '')}
                            >
                              Remove certificate
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="glass dashboard-panel" style={panelStyle}>
                  <h2 style={sectionTitle}>Add Professional</h2>
                  <div style={{ display: 'grid', gap: '0.9rem' }}>
                    <input style={inputStyle} placeholder="Name" value={professionalForm.name} onChange={event => setProfessionalForm(prev => ({ ...prev, name: event.target.value }))} />
                    <select style={inputStyle} value={professionalForm.type} onChange={event => setProfessionalForm(prev => ({ ...prev, type: event.target.value as ProfessionalType }))}>
                      <option>Contractor</option>
                      <option>Interior Designer</option>
                    </select>
                    <select style={inputStyle} value={professionalForm.city} onChange={event => setProfessionalForm(prev => ({ ...prev, city: event.target.value }))}>
                      {supportedCities.map(item => <option key={item}>{item}</option>)}
                    </select>
                    <input style={inputStyle} placeholder="Phone" value={professionalForm.phone} onChange={event => setProfessionalForm(prev => ({ ...prev, phone: event.target.value }))} />
                    <input style={inputStyle} type="number" placeholder="Experience years" value={professionalForm.experienceYears} onChange={event => setProfessionalForm(prev => ({ ...prev, experienceYears: Number(event.target.value) }))} />
                    <input style={inputStyle} type="number" placeholder="Clients served on Grihamm" value={professionalForm.clientsServed} onChange={event => setProfessionalForm(prev => ({ ...prev, clientsServed: Number(event.target.value) }))} />
                    <input style={inputStyle} placeholder="GSTIN" value={professionalForm.gstin} onChange={event => setProfessionalForm(prev => ({ ...prev, gstin: event.target.value.toUpperCase() }))} />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', color: 'var(--text-muted)', fontSize: '0.86rem' }}>
                      <input type="checkbox" checked={professionalForm.grihammCertified} onChange={event => setProfessionalForm(prev => ({ ...prev, grihammCertified: event.target.checked }))} style={{ accentColor: 'var(--primary)', width: 16, height: 16 }} />
                      Grihamm Certified
                    </label>
                    <input style={inputStyle} placeholder="Academy certificate/course" value={professionalForm.academyCredential} onChange={event => setProfessionalForm(prev => ({ ...prev, academyCredential: event.target.value }))} />
                    <input style={inputStyle} type="number" placeholder="Starting price" value={professionalForm.startingPrice} onChange={event => setProfessionalForm(prev => ({ ...prev, startingPrice: Number(event.target.value) }))} />
                    <input style={inputStyle} placeholder="Price unit" value={professionalForm.priceUnit} onChange={event => setProfessionalForm(prev => ({ ...prev, priceUnit: event.target.value }))} />
                    <input style={inputStyle} placeholder={`Services${serviceOptions.length ? ` e.g. ${serviceOptions.slice(0, 2).join(', ')}` : ''}`} value={professionalForm.servicesText} onChange={event => setProfessionalForm(prev => ({ ...prev, servicesText: event.target.value }))} />
                    <input style={inputStyle} placeholder="Service areas" value={professionalForm.serviceAreasText} onChange={event => setProfessionalForm(prev => ({ ...prev, serviceAreasText: event.target.value }))} />
                    <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="Past work image URLs, separated by comma" value={professionalForm.portfolioImagesText} onChange={event => setProfessionalForm(prev => ({ ...prev, portfolioImagesText: event.target.value }))} />
                    <textarea style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} placeholder="Bio" value={professionalForm.bio} onChange={event => setProfessionalForm(prev => ({ ...prev, bio: event.target.value }))} />
                    <button className="btn-primary" style={{ borderRadius: 8 }} onClick={() => void addProfessional()}>ADD & LIST</button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'applications' && (
              <section className="glass dashboard-panel" style={panelStyle}>
                <h2 style={sectionTitle}>Applications</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {data.applications.map(application => (
                    <div key={application.id} className="dashboard-row-card" style={rowCardStyle}>
                      <div>
                        <strong>{application.name}</strong>
                        <span>{application.type} - {application.city} - {application.experience}</span>
                        <span>{application.services.join(', ')} - {formatCurrency(application.startingPrice)} {application.priceUnit}</span>
                        <span>{application.clientsServed} Grihamm/similar clients - GSTIN {application.gstin || 'not provided'} - {application.portfolioImages.length} work image{application.portfolioImages.length === 1 ? '' : 's'}</span>
                        <span>{application.grihammCertified ? `Academy certificate: ${application.academyCredential || 'Claimed, verify before listing'}` : 'No Grihamm Academy certificate claimed'}</span>
                        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>{application.summary}</p>
                      </div>
                      {application.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: '0.6rem' }}>
                          <button className="btn-primary" style={{ borderRadius: 8 }} onClick={() => void updateApplication(application.id, 'approved')}>Approve</button>
                          <button className="btn-outline" style={{ borderRadius: 8, color: '#ff5f56' }} onClick={() => void updateApplication(application.id, 'rejected')}>Reject</button>
                        </div>
                      ) : <strong style={{ textTransform: 'capitalize' }}>{application.status}</strong>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'updates' && (
              <section className="glass dashboard-panel" style={panelStyle}>
                <h2 style={sectionTitle}>Site Updates and Remarks</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {data.siteUpdates.map(update => (
                    <div key={update.id} className="dashboard-row-card" style={rowCardStyle}>
                      <Camera color="var(--primary)" />
                      <div>
                        <strong>{update.title}</strong>
                        <span>{update.projectId} - {professionalsById.get(update.professionalId)?.name || 'Professional'}</span>
                        <p style={{ color: 'var(--text-muted)', marginTop: 6 }}>{update.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'audits' && (
              <section className="glass dashboard-panel" style={panelStyle}>
                <h2 style={sectionTitle}>Paid Grihamm Site Audits</h2>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {data.auditRequests.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No audit requests yet.</p>}
                  {data.auditRequests.map(audit => (
                    <div key={audit.id} className="dashboard-row-card" style={rowCardStyle}>
                      <div>
                        <strong>{audit.projectId} - {formatCurrency(audit.price)}</strong>
                        <span>{audit.reason}</span>
                        <span>Preferred slot: {audit.preferredSlot || 'Not provided'}</span>
                      </div>
                      <select value={audit.status} onChange={event => void updateAudit(audit.id, event.target.value)} style={inputStyle}>
                        <option value="requested">Requested</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="visited">Visited</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section className="glass dashboard-panel" style={{ ...panelStyle, marginTop: '1.5rem' }}>
              <h2 style={sectionTitle}>What admin should watch</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '1rem' }}>
                {[
                  [<AlertTriangle key="a" />, 'Open remarks', 'Customer remarks should be closed before payout.'],
                  [<BadgeIndianRupee key="b" />, 'Escrow checks', 'Release only after photos, customer approval, or Grihamm audit.'],
                  [<ClipboardCheck key="c" />, 'Application quality', 'Approve only profiles with price, services, and city coverage.'],
                ].map(([icon, title, text]) => (
                  <div key={String(title)} style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: 8 }}>
                    <div style={{ color: 'var(--primary)' }}>{icon}</div>
                    <strong>{title}</strong>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>{text}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const tabStyle = (active: boolean): React.CSSProperties => ({
  padding: '0.7rem 1rem',
  borderRadius: 8,
  border: active ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
  background: active ? 'var(--primary)' : 'var(--surface)',
  color: active ? '#111' : 'var(--text)',
  fontWeight: 900,
  fontSize: '0.76rem',
  textTransform: 'uppercase',
});

const panelStyle: React.CSSProperties = {
  padding: '1.6rem',
  border: '1px solid var(--glass-border)',
  borderRadius: 10,
};

const sectionTitle: React.CSSProperties = {
  fontFamily: 'var(--font-serif)',
  fontSize: '2rem',
  letterSpacing: 0,
  marginBottom: '1rem',
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  minWidth: 820,
  borderCollapse: 'collapse',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.8rem',
  borderRadius: 8,
  border: '1px solid var(--glass-border)',
  background: 'var(--surface)',
  color: 'var(--text)',
};

const rowCardStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'minmax(0,1fr) auto',
  gap: '1rem',
  alignItems: 'center',
  padding: '1rem',
  border: '1px solid var(--glass-border)',
  borderRadius: 8,
  background: 'var(--surface)',
};

export default Admin;
