import { useState, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Camera, CheckCircle2, ClipboardCheck, FileImage, MessageSquareText, User, Wallet } from 'lucide-react';
import LanguageSelect from '../components/LanguageSelect';
import { api, formatCurrency, type AuditRequest, type Professional, type Project, type ProjectFile, type Remark, type SiteUpdate, type WalletTransaction } from '../lib/api';
import { useAuth, type AuthUser, type UserProfile } from '../contexts/AuthContext';
import { useGrihammData } from '../lib/useGrihammData';
import { getRazorpayKeyId, openRazorpayCheckout } from '../lib/razorpay';
import { labelKey } from '../i18n';
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
];

const profilePhotoMaxBytes = 5 * 1024 * 1024;
const profilePhotoMaxDimension = 320;

const initialsAvatarDataUrl = (initials: string) => {
  const safeInitials = initials.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 2) || 'GH';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="80" fill="#123f3a"/><text x="50%" y="55%" text-anchor="middle" dominant-baseline="middle" fill="#f8efe1" font-family="Georgia, serif" font-size="56" font-weight="700">${safeInitials}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

const readDataUrl = (file: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result || ''));
  reader.onerror = () => reject(new Error('Unable to read profile image.'));
  reader.readAsDataURL(file);
});

const compressProfilePhoto = async (file: File): Promise<string> => {
  if (!file.type.startsWith('image/')) throw new Error('Please choose an image file.');
  if (file.size > profilePhotoMaxBytes) throw new Error('Please choose an image under 5 MB.');
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return readDataUrl(file);

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Unable to load the selected profile image.'));
      image.src = objectUrl;
    });

    const scale = Math.min(1, profilePhotoMaxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Unable to prepare profile image.');

    context.fillStyle = '#f8efe1';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(result => {
        if (result) resolve(result);
        else reject(new Error('Unable to compress profile image.'));
      }, 'image/jpeg', 0.82);
    });
    return readDataUrl(blob);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
};

const getTabFromSearch = (search: string): CustomerTab => {
  const requestedTab = new URLSearchParams(search).get('tab');
  return requestedTab === 'wallet' || requestedTab === 'settings' ? requestedTab : 'projects';
};

const ProjectOS = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userProfile, updateProfile } = useAuth();
  const { data, loading, error, replaceData } = useGrihammData();
  const activeTab = getTabFromSearch(location.search);
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
  const bookedContractor = selectedProject?.contractorId ? professionalsById.get(selectedProject.contractorId) || null : null;
  const bookedProfessionals = [
    bookedContractor,
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
    setNotice({ tone: 'success', text: 'Escalation sent to the booked contractor and saved on the project record.' });
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
            <div className="dashboard-kicker">{t('dashboard.kicker')}</div>
            <h1>{t('dashboard.title')}</h1>
            <p>{t('dashboard.intro')}</p>
          </div>
          <div className="dashboard-header-actions">
            {projects.length > 0 && (
              <select value={selectedProject?.id || ''} onChange={event => setSelectedProjectId(event.target.value)} className="dashboard-select">
                {projects.map(project => <option key={project.id} value={project.id}>{project.id} - {project.homeType}</option>)}
              </select>
            )}
            {selectedProject && (
              <div className="dashboard-booked-summary">
                <span>{t('dashboard.bookedContractor')}</span>
                <strong>{bookedContractor?.name || t('dashboard.assignmentPending')}</strong>
                <small>{bookedContractor ? `${bookedContractor.type} - ${bookedContractor.city}` : t('dashboard.operationsAssign')}</small>
              </div>
            )}
          </div>
        </div>

        {error && <div className="dashboard-alert warning">Check your Supabase environment variables and migrations. {error}</div>}
        {loading && <div className="dashboard-card">Loading project data...</div>}

        {data && (
          <>
            <div className="profile-tabs" role="tablist" aria-label="Customer project sections">
              {customerTabs.map(tab => (
                <button key={tab.id} type="button" className={activeTab === tab.id ? 'active' : ''} onClick={() => navigate(tab.id === 'projects' ? '/track-project' : `/track-project?tab=${tab.id}`)} aria-selected={activeTab === tab.id}>
                  {tab.icon}
                  {tab.id === 'projects' ? t('dashboard.projectsTracker') : t('dashboard.escrowWallet')}
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
                bookedContractor={bookedContractor}
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
  bookedContractor,
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
  bookedContractor: Professional | null;
  professionalsById: Map<string, Professional>;
  remarkTextByUpdate: Record<string, string>;
  setRemarkTextByUpdate: Dispatch<SetStateAction<Record<string, string>>>;
  submitRemark: (updateId: string) => Promise<void>;
  escalationText: string;
  setEscalationText: Dispatch<SetStateAction<string>>;
  escalateToPartner: () => Promise<void>;
}) => {
  const { t } = useTranslation();
  const translateList = (values: string[]) => values.map(value => t(`taxonomy.${labelKey(value)}`, value)).join(', ');
  const projectWindow = [project.desiredStartDate, project.targetHandoverDate].filter(Boolean).join(' - ') || t('common.pending');

  return (
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
        <div className="project-intent-grid">
          <div><span>{t('dashboard.projectIntent')}</span><strong>{project.projectType || project.homeType}</strong></div>
          <div><span>{t('dashboard.requestedWork')}</span><strong>{translateList(project.requestedServices.length ? project.requestedServices : project.scope)}</strong></div>
          <div><span>{t('dashboard.projectWindow')}</span><strong>{projectWindow}</strong></div>
          <div><span>{t('booking.siteAddressOptional')}</span><strong>{project.siteAddress || t('common.optional')}</strong></div>
        </div>
      </section>

      <section className="dashboard-card">
        <div className="dashboard-section-head">
          <div>
            <h2>{t('dashboard.partnerUpdates')}</h2>
            <p>{t('dashboard.partnerUpdatesText')}</p>
          </div>
        </div>

        <div className="update-feed">
          {updates.length === 0 && <div className="empty-state">{t('dashboard.noUpdates')}</div>}
          {updates.map(update => (
            <article className="update-card" key={update.id}>
              <div className="update-card-head">
                <div>
                  <span>{professionalsById.get(update.professionalId)?.name || 'Booked contractor'}</span>
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
                placeholder={t('dashboard.remarkPlaceholder')}
              />
              <button className="btn-primary" disabled={!(remarkTextByUpdate[update.id] || '').trim()} onClick={() => void submitRemark(update.id)}>
                {t('dashboard.sendRemark')}
              </button>
            </article>
          ))}
        </div>
      </section>
    </main>

    <aside className="profile-side">
      <section className="dashboard-card booked-partner-card">
        <h3><User size={18} /> {t('dashboard.bookedContractor')}</h3>
        <div className="booked-contractor-focus">
          <span>Primary execution partner</span>
          <strong>{bookedContractor?.name || t('dashboard.assignmentPending')}</strong>
          <small>{bookedContractor ? `${bookedContractor.phone || 'Phone pending'} - ${bookedContractor.experienceYears}+ yrs - ${bookedContractor.clientsServed} clients` : 'Your selected contractor will appear here after you book from the contractor directory.'}</small>
        </div>
        <div className="booked-partner-list">
          {bookedProfessionals.length === 0 && <p>{t('dashboard.operationsAssign')}</p>}
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
        <h3><AlertTriangle size={18} /> {t('dashboard.escalationTitle')}</h3>
        <p>{t('dashboard.escalationText')}</p>
        <textarea value={escalationText} onChange={event => setEscalationText(event.target.value)} placeholder={t('dashboard.escalationPlaceholder')} />
        <button className="btn-primary" disabled={!escalationText.trim()} onClick={() => void escalateToPartner()}>{t('dashboard.escalationButton')}</button>
      </section>

      <section className="dashboard-card">
        <h3><MessageSquareText size={18} /> {t('dashboard.remarksTrail')}</h3>
        <div className="remark-list">
          {remarks.length === 0 && <p>{t('dashboard.noRemarks')}</p>}
          {remarks.map(remark => (
            <div key={remark.id}>
              <strong>{remark.authorType}</strong>
              <p>{remark.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-card">
        <h3><FileImage size={18} /> {t('dashboard.uploadedFiles')}</h3>
        <div className="file-list">
          {files.length === 0 && <p>{t('dashboard.noFiles')}</p>}
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
};

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
  const { t } = useTranslation();
  const [fundAmount, setFundAmount] = useState('');
  const [fundReference, setFundReference] = useState('');
  const [razorpayError, setRazorpayError] = useState('');
  const [paying, setPaying] = useState(false);
  const recordedTransactions = transactions.filter(transaction => transaction.status === 'recorded');
  const fundedFromLedger = recordedTransactions
    .filter(transaction => transaction.transactionType === 'fund')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const released = recordedTransactions
    .filter(transaction => transaction.transactionType === 'release')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const refunded = recordedTransactions
    .filter(transaction => transaction.transactionType === 'refund')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const totalPaid = fundedFromLedger || project.escrowAmount;
  const escrow = Math.max(totalPaid - released - refunded, 0);
  const unfunded = Math.max(project.budget - totalPaid, 0);
  const walletPercent = (value: number) => value > 0 ? `${Math.max((value / Math.max(project.budget, 1)) * 100, 3)}%` : '0%';
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
          <h2>{t('dashboard.walletTitle')}</h2>
          <p>{t('dashboard.walletIntro')}</p>
        </div>
        <strong>{formatCurrency(totalPaid)}</strong>
      </div>
      <div className="wallet-bar">
        <span className="released" style={{ width: walletPercent(released) }} />
        <span className="escrow" style={{ width: walletPercent(escrow) }} />
        <span className="unfunded" style={{ width: walletPercent(unfunded) }} />
      </div>
      <div className="wallet-metrics">
        <div><span>{t('dashboard.paidByCustomer')}</span><strong>{formatCurrency(totalPaid)}</strong></div>
        <div><span>{t('dashboard.released')}</span><strong>{formatCurrency(released)}</strong></div>
        <div><span>{t('dashboard.inEscrow')}</span><strong>{formatCurrency(escrow)}</strong></div>
        <div><span>{t('dashboard.unfunded')}</span><strong>{formatCurrency(unfunded)}</strong></div>
      </div>

      <div className="wallet-funding-panel">
        <div>
          <h3>{t('dashboard.fundTitle')}</h3>
          <p>{t('dashboard.fundText')}</p>
        </div>
        <div className="wallet-funding-form">
          <label>
            {t('common.amount')}
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
            {t('dashboard.paymentReference')}
            <input
              value={fundReference}
              onChange={event => setFundReference(event.target.value)}
              placeholder="UPI, bank transfer, gateway, or receipt ID"
            />
          </label>
          <button className="btn-primary" type="button" disabled={funding || requestedAmount <= 0} onClick={() => void submitFunding()}>
            {funding ? 'Recording...' : t('dashboard.recordReference')}
          </button>
          <button className="btn-outline" type="button" disabled={!hasRazorpayKey || paying || funding || requestedAmount <= 0} onClick={() => void payWithRazorpay()}>
            {paying ? 'Opening...' : t('dashboard.payRazorpay')}
          </button>
        </div>
        {!hasRazorpayKey && <div className="dashboard-alert warning compact">Add VITE_RAZORPAY_KEY_ID to enable Razorpay test checkout.</div>}
        {razorpayError && <div className="dashboard-alert warning compact">{razorpayError}</div>}
      </div>

      <div className="wallet-history">
        <div className="dashboard-section-head">
          <div>
            <h3>{t('dashboard.fundingLedger')}</h3>
            <p>Every wallet action is persisted as a transaction tied to this project.</p>
          </div>
        </div>
        {transactions.length === 0 && <div className="empty-state">{t('dashboard.noTransactions')}</div>}
        {transactions.map(transaction => (
          <div className="wallet-history-row" key={transaction.id}>
            <div>
              <strong>{transaction.transactionType}</strong>
              <span>{transaction.providerReference || transaction.provider} - {transaction.status}</span>
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
  const { t } = useTranslation();
  const [phone, setPhone] = useState(userProfile?.phoneNumber || '');
  const [avatarPreview, setAvatarPreview] = useState(userProfile?.photoURL || currentUser?.photoURL || '');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [profileNotice, setProfileNotice] = useState<{ type: 'success' | 'warning'; text: string } | null>(null);

  const profileInitial = selectedAvatar || (currentUser?.displayName?.slice(0, 2) || currentUser?.email?.slice(0, 2) || 'GH').toUpperCase();

  const handlePhoto = async (file: File | undefined) => {
    if (!file || !file.type.startsWith('image/')) return;
    try {
      const compressedPhoto = await compressProfilePhoto(file);
      setAvatarPreview(compressedPhoto);
      setSelectedAvatar('');
      setProfileNotice(null);
    } catch (error) {
      setProfileNotice({
        type: 'warning',
        text: error instanceof Error ? error.message : 'Unable to prepare the selected photo.',
      });
    }
  };

  const saveProfile = async () => {
    try {
      const nextPhoto = avatarPreview || initialsAvatarDataUrl(profileInitial);
      await updateProfile({ phoneNumber: phone, photoURL: nextPhoto, profileCompleted: true });
      setAvatarPreview(nextPhoto);
      setProfileNotice({ type: 'success', text: t('dashboard.profileSaved') });
    } catch (error) {
      setProfileNotice({
        type: 'warning',
        text: error instanceof Error ? error.message : 'Unable to save profile details.',
      });
    }
  };

  return (
    <div className="profile-grid">
      <main className="profile-main">
        <section className="dashboard-card profile-settings-card">
          <div className="dashboard-section-head">
            <div>
              <h2><User size={20} /> {t('dashboard.settingsTitle')}</h2>
              <p>{t('dashboard.settingsText')}</p>
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
                    className={selectedAvatar === option ? 'active' : ''}
                    onClick={() => {
                      setSelectedAvatar(option);
                      setAvatarPreview(initialsAvatarDataUrl(option));
                      setProfileNotice(null);
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
              <label className="camera-upload">
                <Camera size={16} />
                Use camera or photo
                <input type="file" accept="image/*" capture="user" onChange={event => void handlePhoto(event.target.files?.[0])} />
              </label>
            </div>
          </div>

          <div className="dashboard-form-grid">
            <label>
              Name
              <input value={currentUser?.displayName || userProfile?.displayName || ''} disabled />
            </label>
            <label>
              {t('common.email')}
              <input value={currentUser?.email || userProfile?.email || ''} disabled />
            </label>
            <label>
              {t('common.phone')}
              <input value={phone} onChange={event => setPhone(event.target.value)} placeholder="+91 98765 43210" />
            </label>
            <label>
              {t('common.profile')}
              <input value={userProfile?.role || 'homeowner'} disabled />
            </label>
          </div>
          <LanguageSelect />

          {profileNotice && <div className={`dashboard-alert ${profileNotice.type}`}>{profileNotice.text}</div>}
          <button className="btn-primary" type="button" onClick={() => void saveProfile()}>{t('dashboard.saveProfile')}</button>
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
}) => {
  const { t } = useTranslation();
  return (
  <>
    <section className="dashboard-card audit-request-card">
      <h2>{t('dashboard.auditTitle')}</h2>
      <p>{t('dashboard.auditText')}</p>
      <strong>{formatCurrency(auditPrice)}</strong>
      {!hasProject && <div className="dashboard-alert warning">Create a booking before requesting an audit.</div>}
      <textarea value={auditReason} onChange={event => setAuditReason(event.target.value)} placeholder={t('dashboard.auditReason')} />
      <input value={preferredSlot} onChange={event => setPreferredSlot(event.target.value)} placeholder={t('dashboard.preferredSlot')} />
      <button className="btn-primary" disabled={!hasProject || !auditReason.trim()} onClick={() => void requestAudit()}>{t('dashboard.requestAudit')}</button>
    </section>

    <aside className="dashboard-card">
      <h3>{t('dashboard.auditHistory')}</h3>
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
};

export default ProjectOS;
