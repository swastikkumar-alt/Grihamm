import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { AlertTriangle, Camera, CheckCircle2, ClipboardCheck, FileImage, MessageSquareText, Settings, User, Wallet } from 'lucide-react';
import { api, formatCurrency, type AuditRequest, type Professional, type Project, type ProjectFile, type Remark, type SiteUpdate, type WalletTransaction } from '../lib/api';
import { useAuth, type AuthUser, type UserProfile } from '../contexts/AuthContext';
import { useGrihammData } from '../lib/useGrihammData';
import { getRazorpayKeyId, openRazorpayCheckout } from '../lib/razorpay';
import './Dashboard.css';

type CustomerTab = 'projects' | 'wallet' | 'settings';
type FundingRequest = {
  amount: number;
  reference: string;
  provider: string;
  note: string;
};

const customerTabs: { id: CustomerTab; label: string; icon: ReactNode }[] = [
  { id: 'projects', label: 'Projects & Tracker', icon: <ClipboardCheck size={16} /> },
  { id: 'wallet', label: 'Escrow Wallet', icon: <Wallet size={16} /> },
  { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
];

const ProjectOS = () => {
  const { currentUser, userProfile, updateProfile } = useAuth();
  const { data, loading, error, replaceData } = useGrihammData();
  const [activeTab, setActiveTab] = useState<CustomerTab>('projects');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [remarkTextByUpdate, setRemarkTextByUpdate] = useState<Record<string, string>>({});
  const [escalationText, setEscalationText] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [preferredSlot, setPreferredSlot] = useState('');
  const [notice, setNotice] = useState<{ tone: 'success' | 'warning'; text: string } | null>(null);
  const [funding, setFunding] = useState(false);

  const projects = data?.projects || [];
  const selectedProject = projects.find(project => project.id === selectedProjectId) || projects[0] || null;
  const projectUpdates = data?.siteUpdates.filter(update => update.projectId === selectedProject?.id) || [];
  const projectRemarks = data?.remarks.filter(remark => remark.projectId === selectedProject?.id) || [];
  const auditRequests = data?.auditRequests.filter(audit => audit.projectId === selectedProject?.id) || [];
  const projectFiles = data?.projectFiles.filter(file => file.projectId === selectedProject?.id) || [];
  const walletTransactions = data?.walletTransactions.filter(transaction => transaction.projectId === selectedProject?.id) || [];
  const professionalsById = new Map((data?.professionals || []).map(item => [item.id, item]));
  const bookedProfessionals = [
    selectedProject?.designerId ? professionalsById.get(selectedProject.designerId) : null,
    selectedProject?.contractorId ? professionalsById.get(selectedProject.contractorId) : null,
  ].filter(Boolean) as Professional[];

  const submitRemark = async (updateId: string) => {
    const text = remarkTextByUpdate[updateId] || '';
    if (!selectedProject || !text.trim()) return;
    const nextData = await api.createRemark({
      projectId: selectedProject.id,
      updateId,
      authorType: 'customer',
      text: text.trim(),
      actorUid: currentUser?.uid,
    });
    replaceData(nextData);
    setRemarkTextByUpdate(prev => ({ ...prev, [updateId]: '' }));
    setNotice({ tone: 'success', text: 'Remark added for the partner to resolve.' });
  };

  const escalateToPartner = async () => {
    if (!selectedProject || !escalationText.trim()) return;
    const nextData = await api.createRemark({
      projectId: selectedProject.id,
      updateId: null,
      authorType: 'customer',
      text: `Escalation: ${escalationText.trim()}`,
      actorUid: currentUser?.uid,
    });
    replaceData(nextData);
    setEscalationText('');
    setNotice({ tone: 'success', text: 'Escalation sent to the assigned partner and saved on the project record.' });
  };

  const requestAudit = async () => {
    if (!selectedProject || !auditReason.trim()) return;
    const nextData = await api.createAuditRequest({
      projectId: selectedProject.id,
      requestedBy: currentUser?.displayName || currentUser?.email || selectedProject.customerName,
      reason: auditReason.trim(),
      preferredSlot,
      actorUid: currentUser?.uid,
    });
    replaceData(nextData);
    setAuditReason('');
    setPreferredSlot('');
    setNotice({ tone: 'success', text: `Audit requested for ${formatCurrency(nextData.auditPrice)}.` });
  };

  const fundWallet = async ({ amount, reference, provider, note }: FundingRequest) => {
    if (!selectedProject || !currentUser) {
      setNotice({ tone: 'warning', text: 'Sign in and select a project before funding the wallet.' });
      return false;
    }
    setFunding(true);
    try {
      const nextData = await api.fundProjectWallet({
        projectId: selectedProject.id,
        actorUid: currentUser.uid,
        amount,
        provider,
        providerReference: reference,
        note,
      });
      replaceData(nextData);
      setNotice({ tone: 'success', text: `Wallet funding of ${formatCurrency(amount)} was recorded on ${selectedProject.id}.` });
      return true;
    } catch (err) {
      setNotice({ tone: 'warning', text: err instanceof Error ? err.message : 'Could not fund the wallet.' });
      return false;
    } finally {
      setFunding(false);
    }
  };

  return (
    <div className="dashboard-shell">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <div className="dashboard-kicker">Customer dashboard</div>
            <h1>Your booked projects and site tracker.</h1>
            <p>Review booked projects, partner proof, customer remarks, escrow status, and profile settings from one private workspace.</p>
          </div>
          {projects.length > 0 && (
            <select value={selectedProject?.id || ''} onChange={event => setSelectedProjectId(event.target.value)} className="dashboard-select">
              {projects.map(project => <option key={project.id} value={project.id}>{project.id} - {project.homeType}</option>)}
            </select>
          )}
        </div>

        {error && <div className="dashboard-alert warning">Check your Supabase environment variables and migrations. {error}</div>}
        {loading && <div className="dashboard-card">Loading project data...</div>}

        {data && (
          <>
            <div className="profile-tabs" role="tablist" aria-label="Customer project sections">
              {customerTabs.map(tab => (
                <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => setActiveTab(tab.id)} aria-selected={activeTab === tab.id}>
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            {notice && <div className={`dashboard-alert ${notice.tone}`}>{notice.text}</div>}

            {activeTab === 'projects' && selectedProject && (
              <TrackerView
                project={selectedProject}
                updates={projectUpdates}
                remarks={projectRemarks}
                files={projectFiles}
                bookedProfessionals={bookedProfessionals}
                professionalsById={professionalsById}
                remarkTextByUpdate={remarkTextByUpdate}
                setRemarkTextByUpdate={setRemarkTextByUpdate}
                submitRemark={submitRemark}
                escalationText={escalationText}
                setEscalationText={setEscalationText}
                escalateToPartner={escalateToPartner}
              />
            )}

            {activeTab === 'projects' && !selectedProject && (
              <div className="dashboard-card">
                <h2>No project yet</h2>
                <p>Create a booking first. Your booked projects, tracker, partner updates, remarks, and files will appear here.</p>
              </div>
            )}

            {activeTab === 'wallet' && selectedProject && (
              <WalletView
                project={selectedProject}
                transactions={walletTransactions}
                funding={funding}
                currentUser={currentUser}
                userProfile={userProfile}
                onFund={fundWallet}
              />
            )}

            {activeTab === 'wallet' && !selectedProject && (
              <div className="dashboard-card">
                <h2>Escrow wallet</h2>
                <p>Your wallet balance and funding actions appear after the first booking is created.</p>
              </div>
            )}

            {activeTab === 'settings' && (
              <SettingsView
                currentUser={currentUser}
                userProfile={userProfile}
                updateProfile={updateProfile}
                hasProject={Boolean(selectedProject)}
                auditPrice={data.auditPrice}
                audits={auditRequests}
                auditReason={auditReason}
                preferredSlot={preferredSlot}
                setAuditReason={setAuditReason}
                setPreferredSlot={setPreferredSlot}
                requestAudit={requestAudit}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

const TrackerView = ({
  project,
  updates,
  remarks,
  files,
  bookedProfessionals,
  professionalsById,
  remarkTextByUpdate,
  setRemarkTextByUpdate,
  submitRemark,
  escalationText,
  setEscalationText,
  escalateToPartner,
}: {
  project: Project;
  updates: SiteUpdate[];
  remarks: Remark[];
  files: ProjectFile[];
  bookedProfessionals: Professional[];
  professionalsById: Map<string, Professional>;
  remarkTextByUpdate: Record<string, string>;
  setRemarkTextByUpdate: Dispatch<SetStateAction<Record<string, string>>>;
  submitRemark: (updateId: string) => Promise<void>;
  escalationText: string;
  setEscalationText: Dispatch<SetStateAction<string>>;
  escalateToPartner: () => Promise<void>;
}) => (
  <div className="profile-grid">
    <main className="profile-main">
      <section className="dashboard-card project-summary-card">
        <div>
          <span>{project.id}</span>
          <h2>{project.homeType}</h2>
          <p>{project.customerName} - {project.city} - {project.stage}</p>
        </div>
        <strong>{project.progress}%</strong>
        <div className="dashboard-progress"><span style={{ width: `${project.progress}%` }} /></div>
        <p>{project.nextAction}</p>
      </section>

      <section className="dashboard-card">
        <div className="dashboard-section-head">
          <div>
            <h2>Partner updates</h2>
            <p>Leave remarks directly on a partner update when proof needs correction or clarification.</p>
          </div>
        </div>

        <div className="update-feed">
          {updates.length === 0 && <div className="empty-state">No partner updates yet. Uploaded proof will appear here.</div>}
          {updates.map(update => (
            <article className="update-card" key={update.id}>
              <div className="update-card-head">
                <div>
                  <span>{professionalsById.get(update.professionalId)?.name || 'Assigned partner'}</span>
                  <h3>{update.title}</h3>
                  <p>{update.summary}</p>
                </div>
                <time>{new Date(update.createdAt).toLocaleDateString('en-IN')}</time>
              </div>
              <div className="proof-grid">
                {update.images.map(image => <img key={image} src={image} alt="Partner uploaded work proof" />)}
              </div>
              <div className="proof-chip-row">
                {update.completed.map(item => <span key={item}><CheckCircle2 size={14} /> {item}</span>)}
              </div>
              <textarea
                value={remarkTextByUpdate[update.id] || ''}
                onChange={event => setRemarkTextByUpdate(prev => ({ ...prev, [update.id]: event.target.value }))}
                placeholder="Leave a remark for this update..."
              />
              <button className="btn-primary" disabled={!(remarkTextByUpdate[update.id] || '').trim()} onClick={() => void submitRemark(update.id)}>
                Send remark to partner
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>

    <aside className="profile-side">
      <section className="dashboard-card booked-partner-card">
        <h3><User size={18} /> Booked professionals</h3>
        <div className="booked-partner-list">
          {bookedProfessionals.length === 0 && <p>No professional has been assigned yet. Operations will connect the right partner after scope verification.</p>}
          {bookedProfessionals.map(partner => (
            <div key={partner.id} className="booked-partner-row">
              <div className="booked-partner-avatar">{partner.name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase()}</div>
              <div>
                <strong>{partner.name}</strong>
                <span>{partner.type} - {partner.city}</span>
                <small>{partner.phone || 'Phone pending'} - {partner.experienceYears}+ yrs - {partner.clientsServed} clients</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-card escalation-card">
        <h3><AlertTriangle size={18} /> Escalate to partner</h3>
        <p>Use this when there is a delay, mismatch, missing item, or quality concern that the assigned partner should resolve.</p>
        <textarea value={escalationText} onChange={event => setEscalationText(event.target.value)} placeholder="Describe the issue clearly..." />
        <button className="btn-primary" disabled={!escalationText.trim()} onClick={() => void escalateToPartner()}>Escalate issue</button>
      </section>

      <section className="dashboard-card">
        <h3><MessageSquareText size={18} /> Remarks trail</h3>
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
        <h3><FileImage size={18} /> Uploaded files</h3>
        <div className="file-list">
          {files.length === 0 && <p>No files uploaded yet.</p>}
          {files.map(file => (
            file.signedUrl
              ? <a key={file.id} href={file.signedUrl} target="_blank" rel="noreferrer">{file.purpose}: {file.fileName}</a>
              : <span key={file.id}>{file.purpose}: {file.fileName}</span>
          ))}
        </div>
      </section>
    </aside>
  </div>
);

const WalletView = ({
  project,
  transactions,
  funding,
  currentUser,
  userProfile,
  onFund,
}: {
  project: Project;
  transactions: WalletTransaction[];
  funding: boolean;
  currentUser: AuthUser | null;
  userProfile: UserProfile | null;
  onFund: (request: FundingRequest) => Promise<boolean>;
}) => {
  const [fundAmount, setFundAmount] = useState('');
  const [fundReference, setFundReference] = useState('');
  const [razorpayError, setRazorpayError] = useState('');
  const [paying, setPaying] = useState(false);
  const released = Math.round(project.budget * Math.min(project.progress, 45) / 100);
  const escrow = project.escrowAmount;
  const unfunded = Math.max(project.budget - released - escrow, 0);
  const requestedAmount = Math.round(Number(fundAmount || 0));
  const hasRazorpayKey = Boolean(getRazorpayKeyId());

  const submitFunding = async () => {
    if (requestedAmount <= 0) return;
    const reference = fundReference.trim();
    const recorded = await onFund({
      amount: requestedAmount,
      reference,
      provider: 'manual',
      note: reference ? `Customer reference: ${reference}` : 'Manual customer wallet funding record',
    });
    if (recorded) {
      setFundAmount('');
      setFundReference('');
    }
  };

  const payWithRazorpay = async () => {
    if (requestedAmount <= 0) return;
    setRazorpayError('');
    setPaying(true);
    try {
      const response = await openRazorpayCheckout({
        project,
        amount: requestedAmount,
        customerName: currentUser?.displayName || project.customerName,
        customerEmail: currentUser?.email || '',
        customerPhone: userProfile?.phoneNumber,
      });
      const noteParts = [
        `Razorpay test payment: ${response.razorpay_payment_id}`,
        response.razorpay_order_id ? `order: ${response.razorpay_order_id}` : '',
        response.razorpay_signature ? 'signature received' : '',
      ].filter(Boolean);
      const recorded = await onFund({
        amount: requestedAmount,
        reference: response.razorpay_payment_id,
        provider: 'razorpay_test',
        note: noteParts.join('; '),
      });
      if (recorded) {
        setFundAmount('');
        setFundReference('');
      }
    } catch (err) {
      setRazorpayError(err instanceof Error ? err.message : 'Razorpay checkout failed.');
    } finally {
      setPaying(false);
    }
  };

  return (
    <section className="dashboard-card wallet-card">
      <div className="wallet-hero-row">
        <div>
          <h2>Escrow wallet</h2>
          <p>Funds unlock only after partner proof, customer approval, or audit resolution.</p>
        </div>
        <strong>{formatCurrency(project.budget)}</strong>
      </div>
      <div className="wallet-bar">
        <span className="released" style={{ width: `${Math.max((released / Math.max(project.budget, 1)) * 100, 4)}%` }} />
        <span className="escrow" style={{ width: `${Math.max((escrow / Math.max(project.budget, 1)) * 100, 4)}%` }} />
        <span className="unfunded" style={{ width: `${Math.max((unfunded / Math.max(project.budget, 1)) * 100, 4)}%` }} />
      </div>
      <div className="wallet-metrics">
        <div><span>Released</span><strong>{formatCurrency(released)}</strong></div>
        <div><span>In escrow</span><strong>{formatCurrency(escrow)}</strong></div>
        <div><span>Unfunded</span><strong>{formatCurrency(unfunded)}</strong></div>
      </div>

      <div className="wallet-funding-panel">
        <div>
          <h3>Fund this project wallet</h3>
          <p>Record customer funding against this project before milestone releases. Online payment gateway capture can use this same transaction ledger.</p>
        </div>
        <div className="wallet-funding-form">
          <label>
            Amount
            <input
              type="number"
              min="1"
              inputMode="numeric"
              value={fundAmount}
              onChange={event => setFundAmount(event.target.value)}
              placeholder={unfunded ? String(unfunded) : '50000'}
            />
          </label>
          <label>
            Payment reference
            <input
              value={fundReference}
              onChange={event => setFundReference(event.target.value)}
              placeholder="UPI, bank transfer, gateway, or receipt ID"
            />
          </label>
          <button className="btn-primary" type="button" disabled={funding || requestedAmount <= 0} onClick={() => void submitFunding()}>
            {funding ? 'Recording...' : 'Record reference'}
          </button>
          <button className="btn-outline" type="button" disabled={!hasRazorpayKey || paying || funding || requestedAmount <= 0} onClick={() => void payWithRazorpay()}>
            {paying ? 'Opening...' : 'Pay with Razorpay'}
          </button>
        </div>
        {!hasRazorpayKey && <div className="dashboard-alert warning compact">Add VITE_RAZORPAY_KEY_ID to enable Razorpay test checkout.</div>}
        {razorpayError && <div className="dashboard-alert warning compact">{razorpayError}</div>}
      </div>

      <div className="wallet-history">
        <div className="dashboard-section-head">
          <div>
            <h3>Funding ledger</h3>
            <p>Every wallet action is persisted as a transaction tied to this project.</p>
          </div>
        </div>
        {transactions.length === 0 && <div className="empty-state">No wallet transactions recorded yet.</div>}
        {transactions.map(transaction => (
          <div className="wallet-history-row" key={transaction.id}>
            <div>
              <strong>{transaction.transactionType}</strong>
              <span>{transaction.providerReference || transaction.provider}</span>
            </div>
            <div>
              <strong>{formatCurrency(transaction.amount)}</strong>
              <span>{new Date(transaction.createdAt).toLocaleString('en-IN')}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

const avatarOptions = ['GH', 'HM', 'IN', 'BL', 'SK'];

const SettingsView = ({
  currentUser,
  userProfile,
  updateProfile,
  hasProject,
  auditPrice,
  audits,
  auditReason,
  preferredSlot,
  setAuditReason,
  setPreferredSlot,
  requestAudit,
}: {
  currentUser: AuthUser | null;
  userProfile: UserProfile | null;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  hasProject: boolean;
  auditPrice: number;
  audits: AuditRequest[];
  auditReason: string;
  preferredSlot: string;
  setAuditReason: (value: string) => void;
  setPreferredSlot: (value: string) => void;
  requestAudit: () => Promise<void>;
}) => {
  const [phone, setPhone] = useState(userProfile?.phoneNumber || '');
  const [avatarPreview, setAvatarPreview] = useState(currentUser?.photoURL || '');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [saved, setSaved] = useState('');

  const profileInitial = selectedAvatar || (currentUser?.displayName?.slice(0, 2) || currentUser?.email?.slice(0, 2) || 'GH').toUpperCase();

  const handlePhoto = (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result || ''));
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    await updateProfile({ phoneNumber: phone, profileCompleted: true });
    setSaved('Profile details updated.');
  };

  return (
    <div className="profile-grid">
      <main className="profile-main">
        <section className="dashboard-card profile-settings-card">
          <div className="dashboard-section-head">
            <div>
              <h2><User size={20} /> User profile</h2>
              <p>Manage the details Grihamm uses for project coordination.</p>
            </div>
          </div>

          <div className="profile-picture-row">
            <div className="profile-picture">
              {avatarPreview ? <img src={avatarPreview} alt="Profile preview" /> : <span>{profileInitial}</span>}
            </div>
            <div>
              <div className="avatar-picker" aria-label="Avatar choices">
                {avatarOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    className={selectedAvatar === option && !avatarPreview ? 'active' : ''}
                    onClick={() => {
                      setAvatarPreview('');
                      setSelectedAvatar(option);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <label className="camera-upload">
                <Camera size={16} />
                Use camera or photo
                <input type="file" accept="image/*" capture="user" onChange={event => handlePhoto(event.target.files?.[0])} />
              </label>
            </div>
          </div>

          <div className="dashboard-form-grid">
            <label>
              Name
              <input value={currentUser?.displayName || userProfile?.displayName || ''} disabled />
            </label>
            <label>
              Email
              <input value={currentUser?.email || userProfile?.email || ''} disabled />
            </label>
            <label>
              Phone number
              <input value={phone} onChange={event => setPhone(event.target.value)} placeholder="+91 98765 43210" />
            </label>
            <label>
              Profile type
              <input value={userProfile?.role || 'homeowner'} disabled />
            </label>
          </div>

          {saved && <div className="dashboard-alert success">{saved}</div>}
          <button className="btn-primary" type="button" onClick={() => void saveProfile()}>Save profile</button>
        </section>
      </main>

      <aside className="profile-side">
        <AuditView
          auditPrice={auditPrice}
          hasProject={hasProject}
          audits={audits}
          auditReason={auditReason}
          preferredSlot={preferredSlot}
          setAuditReason={setAuditReason}
          setPreferredSlot={setPreferredSlot}
          requestAudit={requestAudit}
        />
      </aside>
    </div>
  );
};

const AuditView = ({
  auditPrice,
  hasProject,
  audits,
  auditReason,
  preferredSlot,
  setAuditReason,
  setPreferredSlot,
  requestAudit,
}: {
  auditPrice: number;
  hasProject: boolean;
  audits: AuditRequest[];
  auditReason: string;
  preferredSlot: string;
  setAuditReason: (value: string) => void;
  setPreferredSlot: (value: string) => void;
  requestAudit: () => Promise<void>;
}) => (
  <>
    <section className="dashboard-card audit-request-card">
      <h2>Audit & Refund</h2>
      <p>Request a physical Grihamm audit when work quality, delay, or scope mismatch needs independent review. Audit findings become part of the project record.</p>
      <strong>{formatCurrency(auditPrice)}</strong>
      {!hasProject && <div className="dashboard-alert warning">Create a booking before requesting an audit.</div>}
      <textarea value={auditReason} onChange={event => setAuditReason(event.target.value)} placeholder="What should our audit team inspect?" />
      <input value={preferredSlot} onChange={event => setPreferredSlot(event.target.value)} placeholder="Preferred visit slot" />
      <button className="btn-primary" disabled={!hasProject || !auditReason.trim()} onClick={() => void requestAudit()}>Request audit</button>
    </section>

    <aside className="dashboard-card">
      <h3>Audit history</h3>
      <div className="remark-list">
        {audits.length === 0 && <p>No audit requested yet.</p>}
        {audits.map(audit => (
          <div key={audit.id}>
            <strong>{audit.status}</strong>
            <p>{audit.reason}</p>
            <span>{formatCurrency(audit.price)}</span>
          </div>
        ))}
      </div>
    </aside>
  </>
);

export default ProjectOS;
