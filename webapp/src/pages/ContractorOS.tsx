import { useMemo, useState } from 'react';
import { Camera, ClipboardList, FileImage, MessageSquareText, ShieldCheck, Upload } from 'lucide-react';
import { api, formatCurrency, type Professional } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { useGrihammData } from '../lib/useGrihammData';
import './Dashboard.css';

const ContractorOS = () => {
  const { currentUser, userProfile } = useAuth();
  const { data, loading, error, replaceData } = useGrihammData();
  const isAdmin = userProfile?.role === 'admin';
  const partners = useMemo(() => {
    const listed = data?.professionals.filter(item => item.status === 'listed') || [];
    return isAdmin ? listed : listed.filter(item => item.partnerUid === currentUser?.uid);
  }, [currentUser?.uid, data?.professionals, isAdmin]);

  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const selectedPartner = partners.find(item => item.id === selectedPartnerId) || partners[0] || null;
  const assignedProjects = data?.projects.filter(project => (
    project.contractorId === selectedPartner?.id || project.designerId === selectedPartner?.id
  )) || [];
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const selectedProject = assignedProjects.find(project => project.id === selectedProjectId) || assignedProjects[0] || null;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [completedText, setCompletedText] = useState('');
  const [nextStep, setNextStep] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const remarks = data?.remarks.filter(remark => remark.projectId === selectedProject?.id) || [];
  const audits = data?.auditRequests.filter(audit => audit.projectId === selectedProject?.id) || [];
  const updates = data?.siteUpdates.filter(update => update.projectId === selectedProject?.id) || [];
  const projectFiles = data?.projectFiles.filter(file => file.projectId === selectedProject?.id && file.purpose === 'progress') || [];

  const handleProgressUpload = (list: FileList | null) => {
    if (!list?.length) return;
    const selected = Array.from(list)
      .filter(file => file.type.startsWith('image/'))
      .filter(file => file.size <= 8 * 1024 * 1024)
      .slice(0, 8);
    setFiles(selected);
  };

  const submitUpdate = async () => {
    if (!selectedProject || !selectedPartner || !summary.trim() || !currentUser) return;
    setSubmitting(true);
    setNotice('');
    try {
      const nextData = await api.createSiteUpdate({
        projectId: selectedProject.id,
        professionalId: selectedPartner.id,
        title: title.trim() || 'Site progress update',
        summary: summary.trim(),
        completed: completedText.split('\n').map(item => item.trim()).filter(Boolean),
        images: [],
        nextStep,
        actorUid: currentUser.uid,
        files,
      });
      replaceData(nextData);
      setTitle('');
      setSummary('');
      setCompletedText('');
      setNextStep('');
      setFiles([]);
      setNotice('Progress update submitted with proof files. Customer can now review and remark.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not submit progress update.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-kicker">Partner profile</div>
            <h1>Upload progress. Resolve remarks.</h1>
            <p>Partners update assigned work with photos, completed tasks, blockers, and next steps. Customers review those updates from their profile and leave remarks against them.</p>
          </div>
          {partners.length > 1 && (
            <select value={selectedPartner?.id || ''} onChange={event => setSelectedPartnerId(event.target.value)} className="dashboard-select">
              {partners.map(partner => <option key={partner.id} value={partner.id}>{partner.name}</option>)}
            </select>
          )}
        </div>

        {error && <div className="dashboard-alert warning">Check your Supabase environment variables and migrations. {error}</div>}
        {loading && <div className="dashboard-card">Loading partner data...</div>}

        {!loading && partners.length === 0 && (
          <div className="dashboard-card">
            <h2>No partner profile linked</h2>
            <p>Your account is not linked to a listed professional profile yet. After admin approval, assigned jobs and upload controls will appear here.</p>
          </div>
        )}

        {data && selectedPartner && (
          <div className="partner-layout">
            <aside className="profile-side dashboard-sticky">
              <section className="dashboard-card partner-card">
                <h2>{selectedPartner.name}</h2>
                <p>{partnerTypeLabel(selectedPartner)}</p>
                <div className="wallet-metrics compact">
                  <div><span>Rating</span><strong>{selectedPartner.rating.toFixed(1)}</strong></div>
                  <div><span>Price</span><strong>{formatCurrency(selectedPartner.startingPrice)}</strong></div>
                </div>
              </section>

              <section className="dashboard-card">
                <h3>Assigned jobs</h3>
                <div className="job-list">
                  {assignedProjects.length === 0 && <p>No assigned project yet.</p>}
                  {assignedProjects.map(project => (
                    <button key={project.id} type="button" className={selectedProject?.id === project.id ? 'active' : ''} onClick={() => setSelectedProjectId(project.id)}>
                      <strong>{project.id}</strong>
                      <span>{project.homeType}</span>
                      <em>{project.stage}</em>
                    </button>
                  ))}
                </div>
              </section>
            </aside>

            {selectedProject ? (
              <main className="profile-main">
                <section className="dashboard-card project-summary-card">
                  <div>
                    <span>{selectedProject.id}</span>
                    <h2>{selectedProject.homeType}</h2>
                    <p>{selectedProject.customerName} - {selectedProject.city}</p>
                  </div>
                  <strong>{selectedProject.progress}%</strong>
                  <div className="dashboard-progress"><span style={{ width: `${selectedProject.progress}%` }} /></div>
                  <p>{selectedProject.nextAction}</p>
                </section>

                <section className="dashboard-card partner-upload-card">
                  <h2><Upload size={20} /> Submit work update</h2>
                  <div className="dashboard-form-grid">
                    <input value={title} onChange={event => setTitle(event.target.value)} placeholder="Update title" />
                    <input value={nextStep} onChange={event => setNextStep(event.target.value)} placeholder="Next visit / next step" />
                    <textarea value={summary} onChange={event => setSummary(event.target.value)} placeholder="Work completed, blockers, material status, and site condition." />
                    <textarea value={completedText} onChange={event => setCompletedText(event.target.value)} placeholder="Completed tasks, one per line" />
                  </div>
                  <label className="upload-drop">
                    <Camera size={20} />
                    <strong>{files.length ? `${files.length} image(s) selected` : 'Upload progress images'}</strong>
                    <span>Images up to 8 MB each. They are saved to Supabase Storage and attached to this project.</span>
                    <input type="file" accept="image/*" multiple onChange={event => handleProgressUpload(event.target.files)} />
                  </label>
                  <button className="btn-primary" disabled={!summary.trim() || submitting} onClick={() => void submitUpdate()}>
                    {submitting ? 'Submitting...' : 'Submit update'}
                  </button>
                  {notice && <div className="dashboard-alert success">{notice}</div>}
                </section>

                <div className="dashboard-two-col">
                  <section className="dashboard-card">
                    <h3><MessageSquareText size={18} /> Customer remarks</h3>
                    <div className="remark-list">
                      {remarks.length === 0 && <p>No remarks yet.</p>}
                      {remarks.map(remark => (
                        <div key={remark.id}>
                          <strong>{remark.authorType}</strong>
                          <p>{remark.text}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="dashboard-card">
                    <h3><ShieldCheck size={18} /> Audit status</h3>
                    <div className="remark-list">
                      {audits.length === 0 && <p>No audit requested on this project.</p>}
                      {audits.map(audit => (
                        <div key={audit.id}>
                          <strong>{audit.status}</strong>
                          <p>{audit.reason}</p>
                          <span>{formatCurrency(audit.price)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>

                <section className="dashboard-card">
                  <h3><ClipboardList size={18} /> Submitted updates</h3>
                  <div className="update-feed compact">
                    {updates.length === 0 && <div className="empty-state">No update submitted yet.</div>}
                    {updates.map(update => (
                      <article className="update-card" key={update.id}>
                        <div className="update-card-head">
                          <div>
                            <span>{new Date(update.createdAt).toLocaleDateString('en-IN')}</span>
                            <h3>{update.title}</h3>
                            <p>{update.summary}</p>
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>

                <section className="dashboard-card">
                  <h3><FileImage size={18} /> Uploaded proof files</h3>
                  <div className="file-list">
                    {projectFiles.length === 0 && <p>No progress files uploaded yet.</p>}
                    {projectFiles.map(file => <span key={file.id}>{file.fileName}</span>)}
                  </div>
                </section>
              </main>
            ) : (
              <section className="dashboard-card">
                <h2>No assigned project selected</h2>
                <p>After admin assigns a project to this partner profile, upload controls and customer remarks will appear here.</p>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const partnerTypeLabel = (partner: Professional | null) => partner ? `${partner.type} - ${partner.city}` : 'Professional';

export default ContractorOS;
