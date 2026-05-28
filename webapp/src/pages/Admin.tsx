import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertTriangle,
  BadgeIndianRupee,
  Briefcase,
  Camera,
  ClipboardCheck,
  MessageSquareText,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
  Wallet,
} from 'lucide-react';
import { api, formatCurrency, type ContactLead, type PlatformUser, type ProfessionalType } from '../lib/api';
import { supportedCities } from '../lib/platformConfig';
import { labelKey } from '../i18n';
import { useGrihammData } from '../lib/useGrihammData';
import './Dashboard.css';

type AdminTab = 'projects' | 'professionals' | 'applications' | 'updates' | 'audits' | 'users' | 'wallet' | 'leads';

const Admin = () => {
  const { t } = useTranslation();
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
    businessAddress: '',
    languagesText: '',
    teamSize: 0,
    monthlyCapacity: '',
    materialBrandsText: '',
    warrantyPolicy: '',
    referenceProjectsText: '',
    insuranceCoverage: '',
    portfolioImagesText: '',
    bio: '',
  });

  const professionalsById = new Map((data?.professionals || []).map(item => [item.id, item]));
  const projectsById = new Map((data?.projects || []).map(item => [item.id, item]));
  const usersByUid = new Map((data?.users || []).map(item => [item.uid, item]));
  const users = data?.users || [];
  const openRemarks = data?.remarks.filter(item => item.status === 'open').length || 0;
  const newContactLeads = data?.contactLeads.filter(item => item.status === 'new').length || 0;
  const totalWalletPaid = (data?.walletTransactions || [])
    .filter(transaction => transaction.transactionType === 'fund' && transaction.status === 'recorded')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const getProjectPaid = (projectId: string) => (data?.walletTransactions || [])
    .filter(transaction => transaction.projectId === projectId && transaction.transactionType === 'fund' && transaction.status === 'recorded')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const getProjectReleased = (projectId: string) => (data?.walletTransactions || [])
    .filter(transaction => transaction.projectId === projectId && transaction.transactionType === 'release' && transaction.status === 'recorded')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const getProjectRefunded = (projectId: string) => (data?.walletTransactions || [])
    .filter(transaction => transaction.projectId === projectId && transaction.transactionType === 'refund' && transaction.status === 'recorded')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const getUserPaid = (uid: string) => (data?.walletTransactions || [])
    .filter(transaction => transaction.actorUid === uid && transaction.transactionType === 'fund' && transaction.status === 'recorded')
    .reduce((total, transaction) => total + transaction.amount, 0);
  const getUserDisplay = (uid: string | null | undefined): PlatformUser | null => uid ? usersByUid.get(uid) || null : null;
  const translateList = (values: string[]) => values.map(value => t(`taxonomy.${labelKey(value)}`, value)).join(', ');

  const stats = [
    { label: t('admin.stats.projects'), value: data?.projects.length || 0, icon: <Briefcase /> },
    { label: t('admin.stats.listed'), value: data?.professionals.filter(item => item.status === 'listed').length || 0, icon: <ShieldCheck /> },
    { label: t('admin.stats.pending'), value: data?.applications.filter(item => item.status === 'pending').length || 0, icon: <UserRoundCheck /> },
    { label: t('admin.stats.remarks'), value: openRemarks, icon: <MessageSquareText /> },
    { label: t('admin.stats.leads'), value: newContactLeads, icon: <MessageSquareText /> },
    { label: t('admin.stats.users'), value: users.length, icon: <UsersRound /> },
    { label: t('admin.stats.wallet'), value: formatCurrency(totalWalletPaid), icon: <Wallet /> },
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

  const updateAudit = async (id: string, status: string) => {
    const nextData = await api.updateAuditStatus(id, status);
    replaceData(nextData);
    setNotice('Audit status updated.');
  };

  const updateContactLead = async (id: string, status: ContactLead['status']) => {
    const nextData = await api.updateContactLeadStatus(id, status);
    replaceData(nextData);
    setNotice('Contact query status updated.');
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
      businessAddress: professionalForm.businessAddress,
      languages: professionalForm.languagesText.split(',').map(item => item.trim()).filter(Boolean),
      teamSize: professionalForm.teamSize,
      monthlyCapacity: professionalForm.monthlyCapacity,
      materialBrands: professionalForm.materialBrandsText.split(',').map(item => item.trim()).filter(Boolean),
      warrantyPolicy: professionalForm.warrantyPolicy,
      referenceProjects: professionalForm.referenceProjectsText.split('\n').map(item => item.trim()).filter(Boolean),
      insuranceCoverage: professionalForm.insuranceCoverage,
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
      businessAddress: '',
      languagesText: '',
      teamSize: 0,
      monthlyCapacity: '',
      materialBrandsText: '',
      warrantyPolicy: '',
      referenceProjectsText: '',
      insuranceCoverage: '',
      portfolioImagesText: '',
      bio: '',
    });
    setNotice('Professional added and listed.');
  };

  return (
    <div className="dashboard-shell admin-console">
      <div className="container">
        <div className="dashboard-header admin-header">
          <div>
            <div className="dashboard-kicker">{t('admin.kicker')}</div>
            <h1>{t('admin.title')}</h1>
            <p>{t('admin.intro')}</p>
          </div>
          <div className="admin-tabs" role="tablist" aria-label="Admin sections">
            {[
              ['projects', t('admin.tabs.projects')],
              ['professionals', t('admin.tabs.professionals')],
              ['applications', t('admin.tabs.applications')],
              ['updates', t('admin.tabs.updates')],
              ['audits', t('admin.tabs.audits')],
              ['leads', t('admin.tabs.leads')],
              ['users', t('admin.tabs.users')],
              ['wallet', t('admin.tabs.wallet')],
            ].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setActiveTab(id as AdminTab)} className={activeTab === id ? 'active' : ''} aria-selected={activeTab === id}>{label}</button>
            ))}
          </div>
        </div>

        {error && <div className="dashboard-alert warning">Check your Supabase environment variables and run the Supabase migration. {error}</div>}
        {loading && <div className="dashboard-card">Loading operations data...</div>}
        {notice && <div className="dashboard-alert success">{notice}</div>}

        {data && (
          <>
            <div className="admin-stat-grid">
              {stats.map(stat => (
                <div key={stat.label} className="admin-stat-card">
                  <div>{stat.icon}</div>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                </div>
              ))}
            </div>

            {activeTab === 'projects' && (
              <section className="dashboard-panel admin-panel">
                <h2>{t('admin.tabs.projects')}</h2>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead><tr>{(t('admin.projectHeaders', { returnObjects: true }) as string[]).map(head => <th key={head}>{head}</th>)}</tr></thead>
                    <tbody>
                      {data.projects.map(project => {
                        const paid = getProjectPaid(project.id) || project.escrowAmount;
                        const released = getProjectReleased(project.id);
                        const refunded = getProjectRefunded(project.id);
                        const escrow = Math.max(paid - released - refunded, 0);
                        return (
                          <tr key={project.id}>
                            <td><strong>{project.id}</strong><span>{project.homeType} - {project.city}</span></td>
                            <td>{project.customerName}<span>{getUserDisplay(project.customerUid)?.email || project.customerUid || 'No login linked'}</span></td>
                            <td>
                              <span>{project.projectType || project.homeType}</span>
                              <span>{translateList(project.requestedServices.length ? project.requestedServices : project.scope)}</span>
                              <span>{project.areaSqft ? `${project.areaSqft} sq ft - ${project.areaType}` : 'Area pending'}</span>
                              <span>{project.siteAddress || t('dashboard.siteAddressOptional')}</span>
                              <span>{project.desiredStartDate || 'Start pending'}{project.targetHandoverDate ? ` - ${project.targetHandoverDate}` : ''}</span>
                            </td>
                            <td>
                              <span>Contractor: {professionalsById.get(project.contractorId || '')?.name || 'Not selected by customer'}</span>
                            </td>
                            <td>
                              <strong>{formatCurrency(paid)}</strong>
                              <span>Escrow: {formatCurrency(escrow)}</span>
                            </td>
                            <td><strong>{project.progress}%</strong><span>{project.stage}</span></td>
                            <td>
                              <strong>{professionalsById.get(project.contractorId || '')?.name || 'Not selected'}</strong>
                              <span>Contractors are selected by customers during booking.</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'professionals' && (
              <div className="admin-supply-grid">
                <section className="dashboard-panel admin-panel">
                  <h2>{t('admin.marketplaceSupply')}</h2>
                  <div className="admin-row-list">
                    {data.professionals.map(pro => (
                      <div key={pro.id} className="dashboard-row-card admin-row-card">
                        <div>
                          <strong>{pro.name}</strong>
                          <span>{pro.type} - {pro.city} - {formatCurrency(pro.startingPrice)} {pro.priceUnit}</span>
                          <span>{pro.clientsServed} Grihamm clients - GSTIN {pro.gstin || 'not added'}</span>
                          <span>{pro.grihammCertified ? `Grihamm Certified - ${pro.academyCredential || 'Academy verified'}` : 'Grihamm certification not enabled'}</span>
                          <span>{translateList(pro.services)}</span>
                          <span>{pro.languages.length ? `${t('contractors.languages')}: ${pro.languages.join(', ')}` : ''}</span>
                          <span>{pro.teamSize ? `${t('contractors.teamSize')}: ${pro.teamSize}` : ''}{pro.monthlyCapacity ? ` - ${pro.monthlyCapacity}` : ''}</span>
                          <span>{pro.warrantyPolicy ? `${t('contractors.warranty')}: ${pro.warrantyPolicy}` : ''}</span>
                          {pro.portfolioImages.length > 0 && (
                            <span>{pro.portfolioImages.length} showcase image{pro.portfolioImages.length === 1 ? '' : 's'} uploaded</span>
                          )}
                        </div>
                        <div className="admin-row-actions">
                          <input
                            className="admin-input"
                            placeholder="Academy certificate/course"
                            value={certificationDrafts[pro.id] ?? pro.academyCredential}
                            onChange={event => setCertificationDrafts(prev => ({ ...prev, [pro.id]: event.target.value }))}
                          />
                          <button className="btn-outline" onClick={() => void toggleProfessional(pro.id, pro.status === 'listed' ? 'paused' : 'listed')}>
                            {pro.status === 'listed' ? 'Pause' : 'List'}
                          </button>
                          <button
                            className="btn-primary"
                            onClick={() => void updateCertification(pro.id, true, (certificationDrafts[pro.id] ?? pro.academyCredential) || 'Grihamm Academy verified')}
                          >
                            {pro.grihammCertified ? 'Save certificate' : 'Mark certified'}
                          </button>
                          {pro.grihammCertified && (
                            <button
                              className="btn-outline danger"
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

                <section className="dashboard-panel admin-panel">
                  <h2>{t('admin.addProfessional')}</h2>
                  <div className="admin-form-stack">
                    <input className="admin-input" placeholder="Name" value={professionalForm.name} onChange={event => setProfessionalForm(prev => ({ ...prev, name: event.target.value }))} />
                    <select className="admin-input" value={professionalForm.type} onChange={event => setProfessionalForm(prev => ({ ...prev, type: event.target.value as ProfessionalType }))}>
                      <option>Contractor</option>
                      <option>Interior Designer</option>
                    </select>
                    <select className="admin-input" value={professionalForm.city} onChange={event => setProfessionalForm(prev => ({ ...prev, city: event.target.value }))}>
                      {supportedCities.map(item => <option key={item}>{item}</option>)}
                    </select>
                    <input className="admin-input" placeholder="Phone" value={professionalForm.phone} onChange={event => setProfessionalForm(prev => ({ ...prev, phone: event.target.value }))} />
                    <input className="admin-input" type="number" placeholder="Experience years" value={professionalForm.experienceYears} onChange={event => setProfessionalForm(prev => ({ ...prev, experienceYears: Number(event.target.value) }))} />
                    <input className="admin-input" type="number" placeholder="Clients served on Grihamm" value={professionalForm.clientsServed} onChange={event => setProfessionalForm(prev => ({ ...prev, clientsServed: Number(event.target.value) }))} />
                    <input className="admin-input" placeholder="GSTIN" value={professionalForm.gstin} onChange={event => setProfessionalForm(prev => ({ ...prev, gstin: event.target.value.toUpperCase() }))} />
                    <label className="admin-checkbox">
                      <input type="checkbox" checked={professionalForm.grihammCertified} onChange={event => setProfessionalForm(prev => ({ ...prev, grihammCertified: event.target.checked }))} />
                      Grihamm Certified
                    </label>
                    <input className="admin-input" placeholder="Academy certificate/course" value={professionalForm.academyCredential} onChange={event => setProfessionalForm(prev => ({ ...prev, academyCredential: event.target.value }))} />
                    <input className="admin-input" type="number" placeholder="Starting price" value={professionalForm.startingPrice} onChange={event => setProfessionalForm(prev => ({ ...prev, startingPrice: Number(event.target.value) }))} />
                    <input className="admin-input" placeholder="Price unit" value={professionalForm.priceUnit} onChange={event => setProfessionalForm(prev => ({ ...prev, priceUnit: event.target.value }))} />
                    <input className="admin-input" placeholder={`Services${serviceOptions.length ? ` e.g. ${serviceOptions.slice(0, 2).join(', ')}` : ''}`} value={professionalForm.servicesText} onChange={event => setProfessionalForm(prev => ({ ...prev, servicesText: event.target.value }))} />
                    <input className="admin-input" placeholder="Service areas" value={professionalForm.serviceAreasText} onChange={event => setProfessionalForm(prev => ({ ...prev, serviceAreasText: event.target.value }))} />
                    <input className="admin-input" placeholder="Business address / operating base" value={professionalForm.businessAddress} onChange={event => setProfessionalForm(prev => ({ ...prev, businessAddress: event.target.value }))} />
                    <input className="admin-input" placeholder="Languages e.g. English, Kannada, Hindi" value={professionalForm.languagesText} onChange={event => setProfessionalForm(prev => ({ ...prev, languagesText: event.target.value }))} />
                    <input className="admin-input" type="number" placeholder="Team size" value={professionalForm.teamSize} onChange={event => setProfessionalForm(prev => ({ ...prev, teamSize: Number(event.target.value) }))} />
                    <input className="admin-input" placeholder="Monthly capacity" value={professionalForm.monthlyCapacity} onChange={event => setProfessionalForm(prev => ({ ...prev, monthlyCapacity: event.target.value }))} />
                    <input className="admin-input" placeholder="Material brands" value={professionalForm.materialBrandsText} onChange={event => setProfessionalForm(prev => ({ ...prev, materialBrandsText: event.target.value }))} />
                    <input className="admin-input" placeholder="Warranty / rework policy" value={professionalForm.warrantyPolicy} onChange={event => setProfessionalForm(prev => ({ ...prev, warrantyPolicy: event.target.value }))} />
                    <textarea className="admin-input" placeholder="Reference projects, one per line" value={professionalForm.referenceProjectsText} onChange={event => setProfessionalForm(prev => ({ ...prev, referenceProjectsText: event.target.value }))} />
                    <input className="admin-input" placeholder="Insurance / safety coverage" value={professionalForm.insuranceCoverage} onChange={event => setProfessionalForm(prev => ({ ...prev, insuranceCoverage: event.target.value }))} />
                    <textarea className="admin-input" placeholder="Past work image URLs, separated by comma" value={professionalForm.portfolioImagesText} onChange={event => setProfessionalForm(prev => ({ ...prev, portfolioImagesText: event.target.value }))} />
                    <textarea className="admin-input" placeholder="Bio" value={professionalForm.bio} onChange={event => setProfessionalForm(prev => ({ ...prev, bio: event.target.value }))} />
                    <button className="btn-primary" onClick={() => void addProfessional()}>Add & List</button>
                  </div>
                </section>
              </div>
            )}

            {activeTab === 'applications' && (
              <section className="dashboard-panel admin-panel">
                <h2>{t('admin.applications')}</h2>
                <div className="admin-row-list">
                  {data.applications.map(application => (
                    <div key={application.id} className="dashboard-row-card admin-row-card">
                      <div>
                        <strong>{application.name}</strong>
                        <span>{application.type} - {application.city} - {application.experience}</span>
                        <span>{translateList(application.services)} - {formatCurrency(application.startingPrice)} {application.priceUnit}</span>
                        <span>{application.clientsServed} Grihamm/similar clients - GSTIN {application.gstin || 'not provided'} - {application.portfolioImages.length} work image{application.portfolioImages.length === 1 ? '' : 's'}</span>
                        <span>{application.languages.length ? `${t('contractors.languages')}: ${application.languages.join(', ')}` : ''}</span>
                        <span>{application.teamSize ? `${t('contractors.teamSize')}: ${application.teamSize}` : ''}{application.monthlyCapacity ? ` - ${application.monthlyCapacity}` : ''}</span>
                        <span>{application.grihammCertified ? `Academy certificate: ${application.academyCredential || 'Claimed, verify before listing'}` : 'No Grihamm Academy certificate claimed'}</span>
                        <p className="admin-row-note">{application.summary}</p>
                      </div>
                      {application.status === 'pending' ? (
                        <div className="admin-inline-actions">
                          <button className="btn-primary" onClick={() => void updateApplication(application.id, 'approved')}>Approve</button>
                          <button className="btn-outline danger" onClick={() => void updateApplication(application.id, 'rejected')}>Reject</button>
                        </div>
                      ) : <strong className="admin-status">{application.status}</strong>}
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'updates' && (
              <section className="dashboard-panel admin-panel">
                <h2>Site Updates and Remarks</h2>
                <div className="admin-row-list">
                  {data.siteUpdates.map(update => (
                    <div key={update.id} className="dashboard-row-card admin-row-card compact">
                      <Camera className="admin-row-icon" />
                      <div>
                        <strong>{update.title}</strong>
                        <span>{update.projectId} - {professionalsById.get(update.professionalId)?.name || 'Professional'}</span>
                        <p className="admin-row-note">{update.summary}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {activeTab === 'audits' && (
              <section className="dashboard-panel admin-panel">
                <h2>Paid Grihamm Site Audits</h2>
                <div className="admin-row-list">
                  {data.auditRequests.length === 0 && <p className="admin-row-note">No audit requests yet.</p>}
                  {data.auditRequests.map(audit => (
                    <div key={audit.id} className="dashboard-row-card admin-row-card">
                      <div>
                        <strong>{audit.projectId} - {formatCurrency(audit.price)}</strong>
                        <span>{audit.reason}</span>
                        <span>Preferred slot: {audit.preferredSlot || 'Not provided'}</span>
                      </div>
                      <select value={audit.status} onChange={event => void updateAudit(audit.id, event.target.value)} className="admin-input">
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

            {activeTab === 'users' && (
              <section className="dashboard-panel admin-panel">
                <h2>{t('admin.signedInUsers')}</h2>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead><tr>{(t('admin.usersHeaders', { returnObjects: true }) as string[]).map(head => <th key={head}>{head}</th>)}</tr></thead>
                    <tbody>
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={8}>No signed-in user profiles found.</td>
                        </tr>
                      )}
                      {users.map(user => (
                        <tr key={user.uid}>
                          <td><strong>{user.displayName}</strong><span>{user.email || user.uid}</span></td>
                          <td><strong>{user.role}</strong></td>
                          <td>{user.preferredLanguage.toUpperCase()}</td>
                          <td>{user.phoneNumber || 'Not added'}</td>
                          <td>{user.activeProject || data.projects.find(project => project.customerUid === user.uid)?.id || 'None'}</td>
                          <td>{user.profileCompleted ? 'Completed' : 'Incomplete'}</td>
                          <td>{formatCurrency(getUserPaid(user.uid))}</td>
                          <td>{user.updatedAt ? new Date(user.updatedAt).toLocaleString('en-IN') : 'Unknown'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'leads' && (
              <section className="dashboard-panel admin-panel">
                <h2>{t('admin.contactQueries')}</h2>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead><tr>{(t('admin.contactHeaders', { returnObjects: true }) as string[]).map(head => <th key={head}>{head}</th>)}</tr></thead>
                    <tbody>
                      {data.contactLeads.length === 0 && (
                        <tr>
                          <td colSpan={7}>No contact queries submitted yet.</td>
                        </tr>
                      )}
                      {data.contactLeads.map(lead => (
                        <tr key={lead.id}>
                          <td>
                            <strong>{lead.name}</strong>
                            <span>{lead.city || 'City not provided'}</span>
                          </td>
                          <td>
                            <strong>{lead.phone || 'No phone'}</strong>
                            <span>{lead.email || 'No email'}</span>
                          </td>
                          <td>{lead.message}</td>
                          <td>
                            <strong>{lead.preferredLanguage.toUpperCase()}</strong>
                            <span>{lead.source}</span>
                          </td>
                          <td>{lead.createdAt ? new Date(lead.createdAt).toLocaleString('en-IN') : 'Unknown'}</td>
                          <td>
                            <select
                              className="admin-input"
                              value={lead.status}
                              onChange={event => void updateContactLead(lead.id, event.target.value as ContactLead['status'])}
                            >
                              <option value="new">New</option>
                              <option value="contacted">Contacted</option>
                              <option value="closed">Closed</option>
                            </select>
                          </td>
                          <td><strong>{lead.id}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {activeTab === 'wallet' && (
              <section className="dashboard-panel admin-panel">
                <h2>{t('admin.walletPayments')}</h2>
                <div className="dashboard-table-wrap">
                  <table className="dashboard-table">
                    <thead><tr>{(t('admin.walletHeaders', { returnObjects: true }) as string[]).map(head => <th key={head}>{head}</th>)}</tr></thead>
                    <tbody>
                      {data.walletTransactions.length === 0 && (
                        <tr>
                          <td colSpan={7}>No wallet transactions recorded yet.</td>
                        </tr>
                      )}
                      {data.walletTransactions.map(transaction => {
                        const project = projectsById.get(transaction.projectId);
                        const user = getUserDisplay(transaction.actorUid);
                        return (
                          <tr key={transaction.id}>
                            <td><strong>{user?.displayName || project?.customerName || transaction.actorUid || 'Unknown user'}</strong><span>{user?.email || transaction.actorUid}</span></td>
                            <td><strong>{transaction.projectId}</strong><span>{project ? `${project.homeType} - ${project.city}` : 'Project not found'}</span></td>
                            <td><strong>{formatCurrency(transaction.amount)}</strong></td>
                            <td>{transaction.transactionType}</td>
                            <td><strong>{transaction.provider}</strong><span>{transaction.providerReference || 'No reference'}</span></td>
                            <td>{transaction.status}</td>
                            <td>{new Date(transaction.createdAt).toLocaleString('en-IN')}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            <section className="dashboard-panel admin-panel admin-watch-panel">
              <h2>What admin should watch</h2>
              <div className="admin-watch-grid">
                {[
                  [<AlertTriangle key="a" />, 'Open remarks', 'Customer remarks should be closed before payout.'],
                  [<BadgeIndianRupee key="b" />, 'Escrow checks', 'Release only after photos, customer approval, or Grihamm audit.'],
                  [<ClipboardCheck key="c" />, 'Application quality', 'Approve only profiles with price, services, and city coverage.'],
                ].map(([icon, title, text]) => (
                  <div key={String(title)}>
                    <div>{icon}</div>
                    <strong>{title}</strong>
                    <p>{text}</p>
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

export default Admin;
