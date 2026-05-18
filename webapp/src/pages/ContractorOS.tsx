import { useState } from 'react';
import { Camera, ClipboardList, MessageSquareText, ShieldCheck, Upload } from 'lucide-react';
import { api, formatCurrency, type Professional } from '../lib/api';
import { useGrihammData } from '../lib/useGrihammData';
import './Dashboard.css';

const ContractorOS = () => {
  const { data, loading, error, replaceData } = useGrihammData();
  const partners = data?.professionals.filter(item => item.status === 'listed') || [];
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const selectedPartner = partners.find(item => item.id === selectedPartnerId) || partners[0] || null;

  const assignedProjects = data?.projects.filter(project => (
    project.contractorId === selectedPartner?.id || project.designerId === selectedPartner?.id
  )) || [];
  const visibleProjects = assignedProjects;
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const selectedProject = visibleProjects.find(project => project.id === selectedProjectId) || visibleProjects[0];

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [completedText, setCompletedText] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [imageText, setImageText] = useState('');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [notice, setNotice] = useState('');

  const remarks = data?.remarks.filter(remark => remark.projectId === selectedProject?.id) || [];
  const audits = data?.auditRequests.filter(audit => audit.projectId === selectedProject?.id) || [];
  const updates = data?.siteUpdates.filter(update => update.projectId === selectedProject?.id) || [];

  const handleProgressUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const selectedFiles = Array.from(files).filter(file => file.type.startsWith('image/')).slice(0, 6);
    const images = await Promise.all(selectedFiles.map(file => new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
      reader.readAsDataURL(file);
    })));
    setUploadedImages(prev => [...prev, ...images].slice(0, 6));
  };

  const submitUpdate = async () => {
    if (!selectedProject || !selectedPartner || !summary.trim()) return;
    const nextData = await api.createSiteUpdate({
      projectId: selectedProject.id,
      professionalId: selectedPartner.id,
      title: title.trim() || 'Site progress update',
      summary: summary.trim(),
      completed: completedText.split('\n').map(item => item.trim()).filter(Boolean),
      images: [
        ...imageText.split(',').map(item => item.trim()).filter(Boolean),
        ...uploadedImages,
      ],
      nextStep,
    });
    replaceData(nextData);
    setTitle('');
    setSummary('');
    setCompletedText('');
    setNextStep('');
    setImageText('');
    setUploadedImages([]);
    setNotice('Site update submitted. Customer and admin can now review it.');
  };

  const partnerTypeLabel = (partner: Professional | null) => partner ? `${partner.type} - ${partner.city}` : 'Professional';

  return (
    <div className="dashboard-shell" style={{ background: 'var(--background)', minHeight: '100vh', padding: '110px 0 60px' }}>
      <div className="container">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', alignItems: 'end', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div>
            <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Partner execution dashboard</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', letterSpacing: 0 }}>Upload progress. Resolve remarks. Protect payouts.</h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: 760, lineHeight: 1.7 }}>Contractors and interior designers should see assigned jobs, customer remarks, audit requests, and the exact proof needed for milestone release.</p>
          </div>
          {partners.length > 0 && (
            <select value={selectedPartner?.id || ''} onChange={event => setSelectedPartnerId(event.target.value)} style={{ minWidth: 280, padding: '0.9rem', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--glass-border)' }}>
              {partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
            </select>
          )}
        </div>

        {error && <div style={{ padding: '1rem', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8 }}>Check your Supabase environment variables and run the Supabase migration. {error}</div>}
        {loading && <div className="glass" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>Loading partner data...</div>}

        {data && selectedPartner && (
          <div className="partner-layout" style={{ display: 'grid', gridTemplateColumns: '300px minmax(0,1fr)', gap: '2rem', alignItems: 'start' }}>
            <aside className="dashboard-sticky" style={{ display: 'grid', gap: '1rem', position: 'sticky', top: 100 }}>
              <section className="glass dashboard-panel" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.8rem', letterSpacing: 0 }}>{selectedPartner.name}</h2>
                <p style={{ color: 'var(--text-muted)' }}>{partnerTypeLabel(selectedPartner)}</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                  <div><strong>{selectedPartner.rating.toFixed(1)}</strong><span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem' }}>rating</span></div>
                  <div><strong>{formatCurrency(selectedPartner.startingPrice)}</strong><span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.8rem' }}>{selectedPartner.priceUnit}</span></div>
                </div>
              </section>

              <section className="glass dashboard-panel" style={{ padding: '1rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                <h3 style={{ marginBottom: '1rem' }}>Assigned jobs</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {visibleProjects.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>No assigned projects yet. Admin assignment will show here after approval.</p>}
                  {visibleProjects.map(project => (
                    <button key={project.id} onClick={() => setSelectedProjectId(project.id)} style={{ textAlign: 'left', padding: '1rem', borderRadius: 8, border: selectedProject.id === project.id ? '1px solid var(--primary)' : '1px solid var(--glass-border)', background: 'var(--surface)', color: 'var(--text)' }}>
                      <strong>{project.id}</strong>
                      <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem' }}>{project.homeType}</span>
                      <span style={{ display: 'block', color: 'var(--primary)', fontSize: '0.76rem', fontWeight: 900 }}>{project.stage}</span>
                    </button>
                  ))}
                </div>
              </section>
            </aside>

            {selectedProject ? (
            <main style={{ display: 'grid', gap: '1.2rem' }}>
              <section className="glass dashboard-panel" style={{ padding: '1.8rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: 'var(--primary)', fontWeight: 900 }}>{selectedProject.id}</div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', letterSpacing: 0 }}>{selectedProject.homeType}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{selectedProject.customerName} - {selectedProject.city}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '2rem', color: 'var(--primary)' }}>{selectedProject.progress}%</strong>
                    <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.84rem' }}>progress</span>
                  </div>
                </div>
                <div style={{ marginTop: '1rem', color: 'var(--text-muted)' }}>{selectedProject.nextAction}</div>
              </section>

              <section className="glass dashboard-panel" style={{ padding: '1.8rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}><Upload size={20} color="var(--primary)" /> Submit site progress</h3>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Update title" style={fieldStyle} />
                  <textarea value={summary} onChange={event => setSummary(event.target.value)} placeholder="Describe work completed, blockers, material status, and site condition." style={{ ...fieldStyle, minHeight: 110, resize: 'vertical' }} />
                  <textarea value={completedText} onChange={event => setCompletedText(event.target.value)} placeholder="Completed tasks, one per line" style={{ ...fieldStyle, minHeight: 90, resize: 'vertical' }} />
                  <input value={imageText} onChange={event => setImageText(event.target.value)} placeholder="Photo URLs separated by comma" style={fieldStyle} />
                  <input type="file" accept="image/*" multiple onChange={event => void handleProgressUpload(event.target.files)} style={fieldStyle} />
                  {uploadedImages.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(88px, 1fr))', gap: '0.7rem' }}>
                      {uploadedImages.map((image, index) => (
                        <img key={`${image.slice(0, 24)}-${index}`} src={image} alt={`Progress proof ${index + 1}`} style={{ width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', borderRadius: 8, border: '1px solid var(--glass-border)' }} />
                      ))}
                    </div>
                  )}
                  <input value={nextStep} onChange={event => setNextStep(event.target.value)} placeholder="Next step / next visit plan" style={fieldStyle} />
                  <button className="btn-primary" style={{ borderRadius: 8, justifySelf: 'start' }} disabled={!summary.trim()} onClick={() => void submitUpdate()}>SUBMIT UPDATE</button>
                </div>
                {notice && <div style={{ marginTop: '1rem', color: 'var(--primary)', fontWeight: 800 }}>{notice}</div>}
              </section>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '1rem' }}>
                <section className="glass dashboard-panel" style={{ padding: '1.4rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}><MessageSquareText size={18} color="var(--primary)" /> Remarks to resolve</h3>
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {remarks.map(remark => (
                      <div key={remark.id} style={{ padding: '0.85rem', borderRadius: 8, background: 'var(--surface)' }}>
                        <strong style={{ textTransform: 'capitalize' }}>{remark.authorType}</strong>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>{remark.text}</p>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="glass dashboard-panel" style={{ padding: '1.4rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}><ShieldCheck size={18} color="var(--primary)" /> Audit status</h3>
                  <div style={{ display: 'grid', gap: '0.8rem' }}>
                    {audits.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No audit requested on this project.</p>}
                    {audits.map(audit => (
                      <div key={audit.id} style={{ padding: '0.85rem', borderRadius: 8, background: 'var(--surface)' }}>
                        <strong>{audit.status}</strong>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>{audit.reason}</p>
                        <span style={{ color: 'var(--primary)', fontWeight: 900 }}>{formatCurrency(audit.price)}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <section className="glass dashboard-panel" style={{ padding: '1.4rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}><ClipboardList size={18} color="var(--primary)" /> Submitted updates</h3>
                <div style={{ display: 'grid', gap: '0.9rem' }}>
                  {updates.map(update => (
                    <div key={update.id} style={{ display: 'grid', gridTemplateColumns: 'auto minmax(0,1fr)', gap: '0.9rem', padding: '0.9rem', background: 'var(--surface)', borderRadius: 8 }}>
                      <Camera color="var(--primary)" />
                      <div>
                        <strong>{update.title}</strong>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>{update.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>
            ) : (
              <section className="glass dashboard-panel" style={{ padding: '2rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', letterSpacing: 0 }}>No assigned project selected</h2>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginTop: '0.6rem' }}>Once admin assigns a residential, corporate, retail, or commercial project, this area will show upload actions, remarks, audit status, and milestone proof.</p>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.9rem 1rem',
  borderRadius: 8,
  border: '1px solid var(--glass-border)',
  background: 'var(--surface)',
  color: 'var(--text)',
  outline: 'none',
};

export default ContractorOS;
