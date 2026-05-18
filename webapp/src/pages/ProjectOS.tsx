import { useState } from 'react';
import { CheckCircle2, ClipboardCheck, MessageSquareText, ShieldCheck } from 'lucide-react';
import { api, formatCurrency } from '../lib/api';
import { useGrihammData } from '../lib/useGrihammData';
import './Dashboard.css';

const ProjectOS = () => {
  const { data, loading, error, replaceData } = useGrihammData();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [remarkTextByUpdate, setRemarkTextByUpdate] = useState<Record<string, string>>({});
  const [auditReason, setAuditReason] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('');
  const [notice, setNotice] = useState('');

  const projects = data?.projects || [];
  const selectedProject = projects.find(project => project.id === selectedProjectId) || projects[0] || null;

  const projectUpdates = data?.siteUpdates.filter(update => update.projectId === selectedProject?.id) || [];
  const projectRemarks = data?.remarks.filter(remark => remark.projectId === selectedProject?.id) || [];
  const auditRequests = data?.auditRequests.filter(audit => audit.projectId === selectedProject?.id) || [];
  const professionalsById = new Map((data?.professionals || []).map(item => [item.id, item]));

  const submitRemark = async (updateId?: string) => {
    const remarkText = updateId ? remarkTextByUpdate[updateId] || '' : '';
    if (!selectedProject || !remarkText.trim()) return;
    const nextData = await api.createRemark({
      projectId: selectedProject.id,
      updateId,
      authorType: 'customer',
      text: remarkText.trim(),
    });
    replaceData(nextData);
    if (updateId) {
      setRemarkTextByUpdate(prev => ({ ...prev, [updateId]: '' }));
    }
    setNotice('Remark added to the project record.');
  };

  const requestAudit = async () => {
    if (!selectedProject || !auditReason.trim()) return;
    const nextData = await api.createAuditRequest({
      projectId: selectedProject.id,
      requestedBy: selectedProject.customerName,
      reason: auditReason.trim(),
      preferredSlot,
    });
    replaceData(nextData);
    setAuditReason('');
    setPreferredSlot('');
    setNotice(`Grihamm audit requested for ${formatCurrency(nextData.auditPrice)}.`);
  };

  return (
    <div className="dashboard-shell" style={{ background: 'var(--background)', minHeight: '100vh', padding: '110px 0 60px' }}>
      <div className="container">
        <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', gap: '2rem', alignItems: 'end', flexWrap: 'wrap', marginBottom: '2rem' }}>
          <div>
            <div style={{ color: 'var(--primary)', fontWeight: 900, fontSize: '0.72rem', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Customer project tracker</div>
            <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '3rem', letterSpacing: 0 }}>Track work, remarks, and audits.</h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: 720, lineHeight: 1.7 }}>Customers see every site update, add remarks against the update, and can request a Grihamm site audit for Rs 999 when independent verification is needed.</p>
          </div>
          {data && (
            <select value={selectedProject?.id || ''} onChange={event => setSelectedProjectId(event.target.value)} style={{ minWidth: 260, padding: '0.9rem', borderRadius: 8, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--glass-border)' }}>
              {data.projects.map(project => <option key={project.id} value={project.id}>{project.id} - {project.homeType}</option>)}
            </select>
          )}
        </div>

        {error && <div style={{ padding: '1rem', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8 }}>Check your Supabase environment variables and run the Supabase migration. {error}</div>}
        {loading && <div className="glass" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>Loading project data...</div>}

        {selectedProject && data && (
          <div className="dashboard-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(300px, 0.75fr)', gap: '2rem', alignItems: 'start' }}>
            <main style={{ display: 'grid', gap: '1.2rem' }}>
              <section className="glass dashboard-panel" style={{ padding: '2rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ color: 'var(--primary)', fontWeight: 900 }}>{selectedProject.id}</div>
                    <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', letterSpacing: 0 }}>{selectedProject.homeType}</h2>
                    <div style={{ color: 'var(--text-muted)' }}>{selectedProject.customerName} - {selectedProject.city}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2rem', color: 'var(--primary)', fontWeight: 900 }}>{selectedProject.progress}%</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{selectedProject.stage}</div>
                  </div>
                </div>
                <div style={{ height: 8, background: 'rgba(255,255,255,0.08)', borderRadius: 999, marginTop: '1.5rem', overflow: 'hidden' }}>
                  <div style={{ width: `${selectedProject.progress}%`, height: '100%', background: 'var(--primary)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '1rem', marginTop: '1.5rem' }}>
                  <div><strong>{formatCurrency(selectedProject.budget)}</strong><span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Project budget</span></div>
                  <div><strong>{formatCurrency(selectedProject.escrowAmount)}</strong><span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Escrow under review</span></div>
                  <div><strong>{selectedProject.scope.join(', ') || 'Scope pending'}</strong><span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Approved scope</span></div>
                </div>
              </section>

              <section style={{ display: 'grid', gap: '1rem' }}>
                <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', letterSpacing: 0 }}>Site updates</h2>
                {projectUpdates.length === 0 && (
                  <div className="glass dashboard-panel" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: 10, color: 'var(--text-muted)' }}>
                    No site updates yet. Once the assigned professional uploads progress, photos and remarks will appear here.
                  </div>
                )}
                {projectUpdates.map(update => (
                  <article key={update.id} className="glass dashboard-panel" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                    <div className="dashboard-update-head" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', gap: '1rem' }}>
                      <div>
                        <div style={{ color: 'var(--primary)', fontSize: '0.72rem', fontWeight: 900, textTransform: 'uppercase' }}>
                          {professionalsById.get(update.professionalId)?.name || 'Professional'}
                        </div>
                        <h3 style={{ marginTop: 6 }}>{update.title}</h3>
                        <p style={{ color: 'var(--text-muted)', lineHeight: 1.7, marginTop: 8 }}>{update.summary}</p>
                      </div>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>{new Date(update.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                    {update.images.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                        {update.images.map(image => <img key={image} src={image} alt="" style={{ width: 128, height: 90, objectFit: 'cover', borderRadius: 8 }} />)}
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '1rem' }}>
                      {update.completed.map(item => <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--primary)', fontWeight: 800, fontSize: '0.78rem' }}><CheckCircle2 size={14} /> {item}</span>)}
                    </div>
                    <div style={{ display: 'grid', gap: '0.8rem', marginTop: '1rem' }}>
                      <textarea value={remarkTextByUpdate[update.id] || ''} onChange={event => setRemarkTextByUpdate(prev => ({ ...prev, [update.id]: event.target.value }))} placeholder="Add a remark against this update..." style={{ width: '100%', minHeight: 80, resize: 'vertical', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.9rem' }} />
                      <button className="btn-primary" style={{ justifySelf: 'start', borderRadius: 8, padding: '0.8rem 1.2rem' }} disabled={!(remarkTextByUpdate[update.id] || '').trim()} onClick={() => void submitRemark(update.id)}>POST REMARK</button>
                    </div>
                  </article>
                ))}
              </section>
            </main>

            <aside style={{ display: 'grid', gap: '1.2rem' }}>
              <section className="glass dashboard-panel" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}><ShieldCheck size={20} color="var(--primary)" /> Request Grihamm Audit</h3>
                <p style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>Our team visits the site, checks work against scope, documents findings, and records the audit in this tracker.</p>
                <div style={{ marginTop: '1rem', color: 'var(--primary)', fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 900 }}>{formatCurrency(data.auditPrice)}</div>
                <textarea value={auditReason} onChange={event => setAuditReason(event.target.value)} placeholder="What should our audit team inspect?" style={{ width: '100%', minHeight: 96, resize: 'vertical', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.9rem', marginTop: '1rem' }} />
                <input value={preferredSlot} onChange={event => setPreferredSlot(event.target.value)} placeholder="Preferred visit slot" style={{ width: '100%', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--glass-border)', borderRadius: 8, padding: '0.9rem', marginTop: '0.8rem' }} />
                <button className="btn-primary" style={{ width: '100%', borderRadius: 8, marginTop: '1rem' }} onClick={() => void requestAudit()} disabled={!auditReason.trim()}>REQUEST AUDIT</button>
              </section>

              <section className="glass dashboard-panel" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}><MessageSquareText size={20} color="var(--primary)" /> Remarks</h3>
                <div style={{ display: 'grid', gap: '0.9rem' }}>
                  {projectRemarks.map(remark => (
                    <div key={remark.id} style={{ padding: '0.9rem', background: 'var(--surface)', borderRadius: 8 }}>
                      <strong style={{ textTransform: 'capitalize' }}>{remark.authorType}</strong>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem', lineHeight: 1.6 }}>{remark.text}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="glass dashboard-panel" style={{ padding: '1.5rem', border: '1px solid var(--glass-border)', borderRadius: 10 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1rem' }}><ClipboardCheck size={20} color="var(--primary)" /> Audit history</h3>
                <div style={{ display: 'grid', gap: '0.8rem' }}>
                  {auditRequests.length === 0 && <p style={{ color: 'var(--text-muted)' }}>No audit requested yet.</p>}
                  {auditRequests.map(audit => (
                    <div key={audit.id} style={{ padding: '0.9rem', background: 'var(--surface)', borderRadius: 8 }}>
                      <strong>{audit.status}</strong>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.86rem' }}>{audit.reason}</p>
                    </div>
                  ))}
                </div>
              </section>
              {notice && <div style={{ color: 'var(--primary)', fontWeight: 800 }}>{notice}</div>}
            </aside>
          </div>
        )}

        {!loading && data?.projects.length === 0 && (
          <div className="glass" style={{ padding: '2rem', border: '1px solid var(--glass-border)' }}>
            No projects yet. Create a booking from the service marketplace first.
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectOS;
