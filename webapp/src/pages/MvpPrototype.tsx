import { useMemo, useState, type ComponentType } from 'react';
import {
  BadgeIndianRupee,
  CheckCircle2,
  ClipboardCheck,
  FileUp,
  HardHat,
  Home,
  MapPin,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { api, formatCurrency, type BootstrapData, type Professional, type ProfessionalType, type Project } from '../lib/api';
import { areaTypes, defaultBooking, projectTypes, supportedCities } from '../lib/platformConfig';
import { useGrihammData } from '../lib/useGrihammData';
import './MvpPrototype.css';

type AppTab = 'book' | 'contractors';

const tabs: { id: AppTab; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'book', label: 'Book', icon: Home },
  { id: 'contractors', label: 'Contractors', icon: HardHat },
];

const bookingHighlights = [
  { label: 'Verified partner match', value: 'City + budget fit' },
  { label: 'Milestone control', value: 'Proof-led releases' },
  { label: 'Audit ready', value: 'Files, notes, approvals' },
];

const bookingProofPoints = [
  'Partner profiles are reviewed before listing.',
  'Budgets stay mapped to scope and milestone proof.',
  'Homeowners, contractors, and operations work from one brief.',
];

const allowedFileTypes = ['image/', 'application/pdf'];

const getInitials = (value: string) => value.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'GH';
const todayInputValue = () => new Date().toISOString().slice(0, 10);

const formatScheduleDate = (value: string) => {
  if (!value) return '';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
};

const getProfessionalLoad = (professional: Professional, projects: Project[]) => {
  const activeProjects = projects.filter(project => (
    project.progress < 100
    && !/complete|handover|closed/i.test(project.stage)
    && (project.contractorId === professional.id || project.designerId === professional.id)
  ));
  return activeProjects.length;
};

const getAvailability = (professional: Professional, projects: Project[], selectedStartDate: string) => {
  const activeCount = getProfessionalLoad(professional, projects);
  const dateLabel = selectedStartDate ? formatScheduleDate(selectedStartDate) : 'your selected start date';
  if (activeCount > 0) {
    return {
      className: 'busy',
      label: 'On project now',
      detail: `${activeCount} active Grihamm project${activeCount > 1 ? 's' : ''}. Slot check needed for ${dateLabel}.`,
    };
  }
  return {
    className: 'open',
    label: 'Open for new project',
    detail: selectedStartDate ? `Can be shortlisted for ${dateLabel}.` : 'Pick a start date to run a slot check.',
  };
};

const getBudgetFit = (professional: Professional, booking: typeof defaultBooking) => {
  if (!professional.startingPrice) {
    return { className: 'review', label: 'Quote after site review', detail: 'Visible in list; operations will confirm pricing.' };
  }
  const estimate = estimateProfessionalCost(professional, booking.areaSqft);
  const maxBudget = Math.max(booking.budgetMax, 1);
  if (estimate <= maxBudget) {
    return { className: 'fit', label: 'Budget fit', detail: `${formatCurrency(estimate)} estimate` };
  }
  return { className: 'over', label: 'Above selected budget', detail: `${formatCurrency(estimate)} estimate` };
};

const PortfolioImage = ({ src, alt }: { src: string; alt: string }) => {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return <div className="mvp-gallery-fallback">Image pending verification</div>;
  }

  return <img src={src} alt={alt} loading="lazy" onError={() => setHasError(true)} />;
};

const estimateProfessionalCost = (professional: Professional, areaSqft: number) => {
  if (professional.priceUnit.toLowerCase().includes('sqft')) {
    return professional.startingPrice * Math.max(Number(areaSqft) || 1, 1);
  }
  return professional.startingPrice;
};

const buildProjectScope = (
  propertyLabel: string,
  subtype: string,
  areaType: string,
  areaSqft: number,
  budgetMin: number,
  budgetMax: number,
  booking: typeof defaultBooking,
) => [
  `${propertyLabel}: ${subtype}`,
  `${areaType}: ${areaSqft} sqft`,
  `Budget range: ${formatCurrency(budgetMin)} - ${formatCurrency(budgetMax)}`,
  booking.desiredStartDate ? `Desired start date: ${formatScheduleDate(booking.desiredStartDate)}` : '',
  booking.targetHandoverDate ? `Target handover date: ${formatScheduleDate(booking.targetHandoverDate)}` : '',
  booking.siteAddress ? `Site address: ${booking.siteAddress}` : '',
  booking.timeline ? `Timeline notes: ${booking.timeline}` : '',
  booking.visitPreference ? `Visit preference: ${booking.visitPreference}` : '',
].filter(Boolean);

const AppTabs = ({ activeTab, onChange }: { activeTab: AppTab; onChange: (tab: AppTab) => void }) => (
  <nav className="mvp-tabs" aria-label="Grihamm product sections">
    <div className="mvp-tabs-inner">
      {tabs.map(tab => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            type="button"
            className={`mvp-tab${activeTab === tab.id ? ' active' : ''}`}
            aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
          >
            <Icon size={16} />
            {tab.label}
          </button>
        );
      })}
    </div>
  </nav>
);

const Notice = ({ error, message }: { error: string; message: string }) => (
  <>
    {error && <div className="mvp-alert warning">Check Supabase environment variables and migrations. {error}</div>}
    {message && <div className="mvp-alert success">{message}</div>}
  </>
);

const BookingBrief = ({
  booking,
  updateBooking,
  onSubmit,
  files,
  onFiles,
  loading,
}: {
  booking: typeof defaultBooking;
  updateBooking: <K extends keyof typeof defaultBooking>(field: K, value: (typeof defaultBooking)[K]) => void;
  onSubmit: () => void;
  files: File[];
  onFiles: (files: File[]) => void;
  loading: boolean;
}) => {
  const handleFileInput = (list: FileList | null) => {
    if (!list) return;
    const nextFiles = Array.from(list)
      .filter(file => allowedFileTypes.some(type => file.type.startsWith(type)))
      .filter(file => file.size <= 8 * 1024 * 1024)
      .slice(0, 8);
    onFiles(nextFiles);
  };
  const selectedProjectType = projectTypes.find(item => item.label === booking.projectType) || projectTypes[0];
  const isCustomSpace = booking.propertySubtype.toLowerCase().startsWith('custom');

  return (
    <section className="mvp-book-grid">
      <div className="mvp-book-intro">
        <h1>Book verified interiors execution.</h1>
        <p className="mvp-lead">
          Share the site brief, attach plans or photos, choose verified partners, and keep every milestone tied to proof.
        </p>

        <div className="mvp-hero-visual" aria-label="Premium interior project preview">
          <img src="/hero-bg.png" alt="Finished premium living room interior" />
          <div className="mvp-hero-overlay">
            <div>
              <span>Brief quality</span>
              <strong>Ready for team matching</strong>
            </div>
            <div className="mvp-hero-icons" aria-hidden="true">
              <ShieldCheck size={18} />
              <Sparkles size={18} />
              <CheckCircle2 size={18} />
            </div>
          </div>
        </div>

        <div className="mvp-highlight-grid">
          {bookingHighlights.map(item => (
            <div key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>

        <div className="mvp-proof-list">
          {bookingProofPoints.map(item => (
            <span key={item}><CheckCircle2 size={15} /> {item}</span>
          ))}
        </div>
      </div>

      <div>
        <div className="mvp-form-card">
          <div className="mvp-form-grid mvp-date-grid">
            <label className="mvp-field">
              <span>When do you want to start?</span>
              <input
                type="date"
                min={todayInputValue()}
                value={booking.desiredStartDate}
                onChange={event => updateBooking('desiredStartDate', event.target.value)}
              />
            </label>
            <label className="mvp-field">
              <span>Target handover date</span>
              <input
                type="date"
                min={booking.desiredStartDate || todayInputValue()}
                value={booking.targetHandoverDate}
                onChange={event => updateBooking('targetHandoverDate', event.target.value)}
              />
            </label>
          </div>
          <p className="mvp-date-note">
            We use these calendar dates to avoid shortlisting contractors who already have active Grihamm projects in the same window.
          </p>

          <div className="mvp-form-grid">
            <label className="mvp-field">
              <span>Timeline notes</span>
              <input value={booking.timeline} onChange={event => updateBooking('timeline', event.target.value)} placeholder="e.g. weekdays only, society work hours, phased handover" />
            </label>
          </div>

          <div className="mvp-form-grid">
            <label className="mvp-field">
              <span>Project type</span>
              <select
                value={booking.projectType}
                onChange={event => {
                  const nextType = projectTypes.find(item => item.label === event.target.value) || projectTypes[0];
                  updateBooking('projectType', event.target.value);
                  updateBooking('propertySubtype', nextType.spaces[0]);
                  updateBooking('customSpace', '');
                  updateBooking('homeType', `${nextType.label} - ${nextType.spaces[0]}`);
                }}
              >
                {projectTypes.map(item => <option key={item.label}>{item.label}</option>)}
              </select>
            </label>
            <label className="mvp-field">
              <span>City</span>
              <select value={booking.city} onChange={event => updateBooking('city', event.target.value)}>
                {supportedCities.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <div className="mvp-field">
            <span>Space size</span>
            <div className="mvp-soft-options">
              {selectedProjectType.spaces.map(option => (
                <button
                  key={option}
                  type="button"
                  className={booking.propertySubtype === option ? 'active' : ''}
                  onClick={() => {
                    updateBooking('propertySubtype', option);
                    if (!option.toLowerCase().startsWith('custom')) {
                      updateBooking('customSpace', '');
                    }
                    updateBooking('homeType', `${booking.projectType || 'Project'} - ${option}`);
                  }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          {isCustomSpace && (
            <label className="mvp-field">
              <span>Custom space details</span>
              <input
                value={booking.customSpace}
                onChange={event => {
                  updateBooking('customSpace', event.target.value);
                  updateBooking('homeType', `${booking.projectType || 'Project'} - ${event.target.value || 'Custom'}`);
                }}
                placeholder="e.g. 5,200 sq ft restaurant, duplex renovation, 12-seat clinic"
              />
            </label>
          )}

          <div className="mvp-form-grid">
            <label className="mvp-field">
              <span>Area type</span>
              <select value={booking.areaType} onChange={event => updateBooking('areaType', event.target.value)}>
                {areaTypes.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
            <label className="mvp-field">
              <span>Area sq ft</span>
              <input type="number" min="0" value={booking.areaSqft} onChange={event => updateBooking('areaSqft', Number(event.target.value))} />
            </label>
          </div>

          <div className="mvp-form-grid">
            <label className="mvp-field">
              <span>Minimum budget</span>
              <input type="number" min="0" value={booking.budgetMin} onChange={event => updateBooking('budgetMin', Number(event.target.value))} />
            </label>
            <label className="mvp-field">
              <span>Maximum budget</span>
              <input type="number" min="0" value={booking.budgetMax} onChange={event => updateBooking('budgetMax', Number(event.target.value))} />
            </label>
          </div>

          <div className="mvp-form-grid">
            <label className="mvp-field">
              <span>Site address</span>
              <input value={booking.siteAddress} onChange={event => updateBooking('siteAddress', event.target.value)} placeholder="Apartment, area, landmark" />
            </label>
            <label className="mvp-field">
              <span>Visit preference</span>
              <select value={booking.visitPreference} onChange={event => updateBooking('visitPreference', event.target.value)}>
                <option>Site visit this week</option>
                <option>Weekend visit preferred</option>
                <option>Online consultation first</option>
                <option>Call me before scheduling</option>
              </select>
            </label>
          </div>

          <label className="mvp-field">
            <span>Scope notes</span>
            <textarea
              value={booking.scopeText}
              onChange={event => updateBooking('scopeText', event.target.value)}
              placeholder="Rooms, materials, existing constraints, floor changes, retained furniture, vastu needs, dust limits, lift access, working-hour restrictions, or anything the project manager should know."
            />
          </label>

          <label className="mvp-file-drop">
            <input type="file" accept="image/*,application/pdf" multiple onChange={event => handleFileInput(event.target.files)} />
            <FileUp size={20} />
            <strong>Attach floor plans, current photos, references, or BOQs</strong>
            <span>Images or PDFs up to 8 MB each. Files upload after booking is created.</span>
          </label>

          {files.length > 0 && (
            <div className="mvp-file-list">
              {files.map(file => (
                <span key={`${file.name}-${file.size}`}>{file.name}</span>
              ))}
            </div>
          )}

          <button className="mvp-primary" type="button" disabled={loading} onClick={onSubmit}>
            {loading ? 'Checking brief...' : 'See verified team'}
          </button>
        </div>
      </div>

    </section>
  );
};

const RecommendedTeam = ({ professionals, projects, booking, onBook }: { professionals: Professional[]; projects: Project[]; booking: typeof defaultBooking; onBook: (professional?: Professional) => void }) => {
  const listed = professionals.filter(item => (
    item.status === 'listed'
    && item.city === booking.city
    && estimateProfessionalCost(item, booking.areaSqft) <= Math.max(booking.budgetMax, 1)
  ));
  const designer = listed.find(item => item.type === 'Interior Designer') || listed[0];
  const contractors = listed.filter(item => item.type === 'Contractor').slice(0, 4);
  const team = [designer, ...contractors].filter(Boolean) as Professional[];

  return (
    <section className="mvp-section">
      <div className="mvp-section-head">
        <div>
          <h2>Recommended team for this brief</h2>
          <p>{booking.homeType} in {booking.city}. Matches are filtered from listed Supabase partners by city, budget, and role.</p>
        </div>
        <button className="mvp-secondary" type="button" onClick={() => onBook()}>Create request</button>
      </div>

      <div className="mvp-team-grid">
        {team.length === 0 && <div className="mvp-empty">No listed specialists match this city yet. Create a request and operations can assign manually.</div>}
        {team.map(member => (
          <article className="mvp-team-card" key={member.id}>
            {(() => {
              const availability = getAvailability(member, projects, booking.desiredStartDate);
              return <span className={`mvp-availability ${availability.className}`}>{availability.label}</span>;
            })()}
            <div className="mvp-avatar">{getInitials(member.name)}</div>
            <h3>{member.name}</h3>
            <p>{member.type}</p>
            <span>{member.services.slice(0, 2).join(', ') || member.city}</span>
            <small>{member.experienceYears}+ yrs - {member.clientsServed} clients - {formatCurrency(estimateProfessionalCost(member, booking.areaSqft))}</small>
          </article>
        ))}
      </div>
    </section>
  );
};

const ProfessionalDirectory = ({
  data,
  booking,
  onBook,
}: {
  data: BootstrapData | null;
  booking: typeof defaultBooking;
  onBook: (professional: Professional) => void;
}) => {
  const [type, setType] = useState<'All' | ProfessionalType>('All');
  const [service, setService] = useState('All services');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const projects = data?.projects || [];
  const professionals = useMemo(() => data?.professionals || [], [data?.professionals]);
  const services = useMemo(() => ['All services', ...Array.from(new Set(professionals.flatMap(item => item.services)))], [professionals]);
  const filtered = professionals.filter(pro => {
    if (pro.status !== 'listed') return false;
    if (pro.city !== booking.city) return false;
    if (type !== 'All' && pro.type !== type) return false;
    if (service !== 'All services' && !pro.services.includes(service)) return false;
    return true;
  }).sort((a, b) => {
    const aFit = getBudgetFit(a, booking).className === 'over' ? 1 : 0;
    const bFit = getBudgetFit(b, booking).className === 'over' ? 1 : 0;
    return aFit - bFit || getProfessionalLoad(a, projects) - getProfessionalLoad(b, projects) || b.rating - a.rating || a.name.localeCompare(b.name);
  });
  const getPartnerStrengths = (pro: Professional) => [
    `${pro.experienceYears}+ years on-site experience`,
    `${pro.clientsServed} completed client jobs`,
    pro.grihammCertified ? pro.academyCredential || 'Grihamm verified execution process' : 'Profile reviewed by operations',
  ];

  return (
    <section className="mvp-section">
      <div className="mvp-section-head">
        <div>
          <h2>Verified partners</h2>
          <p>Browse live Supabase listings by city, trade, price, verification, and active project load.</p>
          <small className="mvp-filter-note">Approved contractors stay visible even when they are above the current budget; cards show the reason instead of silently hiding them.</small>
        </div>
        <div className="mvp-filter-row">
          <select value={type} onChange={event => setType(event.target.value as 'All' | ProfessionalType)}>
            <option>All</option>
            <option>Interior Designer</option>
            <option>Contractor</option>
          </select>
          <select value={service} onChange={event => setService(event.target.value)}>
            {services.map(item => <option key={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="mvp-directory">
        {filtered.map(pro => (
          <article className="mvp-pro-card" key={pro.id} onClick={() => setSelectedProfessional(pro)}>
            {pro.grihammCertified && <span className="mvp-certified"><Star size={13} fill="currentColor" /> Certified</span>}
            <div className="mvp-pro-head">
              <div className="mvp-avatar">{getInitials(pro.name)}</div>
              <div>
                <h3>{pro.name}</h3>
                <p><MapPin size={14} /> {pro.city} - {pro.type}</p>
              </div>
            </div>
            {(() => {
              const availability = getAvailability(pro, projects, booking.desiredStartDate);
              const budgetFit = getBudgetFit(pro, booking);
              return (
                <div className="mvp-status-stack">
                  <div className={`mvp-availability-card ${availability.className}`}>
                    <strong>{availability.label}</strong>
                    <span>{availability.detail}</span>
                  </div>
                  <div className={`mvp-budget-card ${budgetFit.className}`}>
                    <strong>{budgetFit.label}</strong>
                    <span>{budgetFit.detail}</span>
                  </div>
                </div>
              );
            })()}
            <p>{pro.bio}</p>
            <div className="mvp-strength-list">
              {getPartnerStrengths(pro).map(item => <span key={item}>{item}</span>)}
            </div>
            <div className="mvp-chip-row">
              <span><Star size={14} fill="currentColor" /> {pro.rating.toFixed(1)} ({pro.reviewCount})</span>
              <span><BadgeIndianRupee size={14} /> {pro.startingPrice ? `${formatCurrency(pro.startingPrice)} ${pro.priceUnit}` : pro.priceUnit}</span>
              <span><ClipboardCheck size={14} /> {pro.clientsServed} clients</span>
            </div>
            {pro.portfolioImages.length > 0 && (
              <div className="mvp-gallery">
                {pro.portfolioImages.slice(0, 3).map(image => <PortfolioImage key={image} src={image} alt={`${pro.name} work sample`} />)}
              </div>
            )}
            {pro.portfolioImages.length === 0 && (
              <div className="mvp-gallery-empty">Past-work images pending verification</div>
            )}
            <div className="mvp-pro-actions">
              <button className="mvp-secondary" type="button" onClick={event => { event.stopPropagation(); setSelectedProfessional(pro); }}>View details</button>
              <button className="mvp-primary" type="button" onClick={event => { event.stopPropagation(); onBook(pro); }}>Book</button>
            </div>
          </article>
        ))}
      </div>

      {selectedProfessional && (
        <div className="mvp-modal-backdrop" onClick={() => setSelectedProfessional(null)}>
          <section className="mvp-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <button className="mvp-modal-close" type="button" aria-label="Close" onClick={() => setSelectedProfessional(null)}><X size={18} /></button>
            <div className="mvp-pro-head">
              <div className="mvp-avatar large">{getInitials(selectedProfessional.name)}</div>
              <div>
                <h2>{selectedProfessional.name}</h2>
                <p>{selectedProfessional.type} in {selectedProfessional.city}</p>
              </div>
            </div>
            <p>{selectedProfessional.bio}</p>
            {selectedProfessional.portfolioImages.length > 0 && (
              <div className="mvp-modal-gallery">
                {selectedProfessional.portfolioImages.slice(0, 6).map(image => (
                  <PortfolioImage key={image} src={image} alt={`${selectedProfessional.name} past work`} />
                ))}
              </div>
            )}
            <div className="mvp-metric-grid">
              <div><span>Starting price</span><strong>{selectedProfessional.startingPrice ? `${formatCurrency(selectedProfessional.startingPrice)} ${selectedProfessional.priceUnit}` : selectedProfessional.priceUnit}</strong></div>
              <div><span>Estimate</span><strong>{selectedProfessional.startingPrice ? formatCurrency(estimateProfessionalCost(selectedProfessional, booking.areaSqft)) : 'Needs site review'}</strong></div>
              <div><span>GSTIN</span><strong>{selectedProfessional.gstin || 'Pending'}</strong></div>
              <div><span>Academy</span><strong>{selectedProfessional.grihammCertified ? selectedProfessional.academyCredential || 'Verified' : 'Not certified'}</strong></div>
            </div>
            <div className="mvp-partner-value">
              <h3>What they bring to the table</h3>
              {getPartnerStrengths(selectedProfessional).map(item => <span key={item}>{item}</span>)}
              {selectedProfessional.serviceAreas.length > 0 && <span>Works across {selectedProfessional.serviceAreas.join(', ')}</span>}
              <span>{getAvailability(selectedProfessional, projects, booking.desiredStartDate).detail}</span>
            </div>
            <div className="mvp-chip-row">{selectedProfessional.services.map(item => <span key={item}>{item}</span>)}</div>
            <button className="mvp-primary" type="button" onClick={() => onBook(selectedProfessional)}>Book this professional</button>
          </section>
        </div>
      )}
    </section>
  );
};

const MvpPrototype = () => {
  const { currentUser } = useAuth();
  const { data, loading, error, replaceData, reload } = useGrihammData();
  const [activeTab, setActiveTab] = useState<AppTab>('book');
  const [booking, setBooking] = useState(defaultBooking);
  const [briefFiles, setBriefFiles] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [briefReady, setBriefReady] = useState(false);

  const selectedPropertyLabel = booking.projectType.trim() || 'Property project';
  const selectedSubtype = booking.propertySubtype === 'Custom'
    ? booking.customSpace.trim() || 'Custom requirement'
    : booking.propertySubtype.trim() || 'Custom requirement';

  const updateBooking = <K extends keyof typeof defaultBooking>(field: K, value: (typeof defaultBooking)[K]) => {
    setBooking(prev => ({ ...prev, [field]: value }));
    setBriefReady(false);
  };

  const validateBrief = () => {
    if (!booking.projectType.trim()) return 'Choose a project type.';
    if (!selectedSubtype.trim() || selectedSubtype === 'Custom requirement') return 'Choose or describe the space size.';
    if (!booking.city.trim()) return 'Choose a city.';
    if (!booking.areaSqft || booking.areaSqft < 100) return 'Enter a valid area.';
    if (!booking.budgetMax || booking.budgetMax < booking.budgetMin) return 'Enter a valid budget range.';
    if (!booking.siteAddress.trim()) return 'Add the site address or locality.';
    if (!booking.desiredStartDate) return 'Select when you want the project to start.';
    if (booking.targetHandoverDate && booking.targetHandoverDate < booking.desiredStartDate) return 'Target handover cannot be before the start date.';
    return '';
  };

  const reviewBrief = () => {
    const validationMessage = validateBrief();
    if (validationMessage) {
      setMessage(validationMessage);
      setBriefReady(false);
      return;
    }
    setMessage('Brief ready. Showing recommended team from listed partners.');
    setBriefReady(true);
  };

  const requireLogin = (action: string) => {
    if (currentUser) return true;
    setMessage(`Login to ${action}. Browsing professionals stays open.`);
    setIsAuthModalOpen(true);
    return false;
  };

  const createProject = async (professional?: Professional) => {
    if (!requireLogin(professional ? 'book this professional' : 'create a booking request') || !currentUser) return;
    setSaving(true);
    setMessage('');
    try {
      const scope = buildProjectScope(selectedPropertyLabel, selectedSubtype, booking.areaType, booking.areaSqft, booking.budgetMin, booking.budgetMax, booking);
      const scopedBrief = [
        ...scope,
        professional ? `Requested professional: ${professional.name}` : '',
        booking.scopeText.trim(),
      ].filter(Boolean);
      const nextData = await api.createProject({
        customerUid: currentUser.uid,
        customerName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Grihamm customer',
        city: booking.city,
        homeType: `${selectedPropertyLabel} - ${selectedSubtype}`,
        budget: booking.budgetMax,
        scope: scopedBrief,
        designerId: professional?.type === 'Interior Designer' ? professional.id : null,
        contractorId: professional?.type === 'Contractor' ? professional.id : null,
        desiredStartDate: booking.desiredStartDate,
        targetHandoverDate: booking.targetHandoverDate,
        timelineNote: booking.timeline,
      });
      replaceData(nextData);
      const createdProject = nextData.projects[0];
      if (createdProject && briefFiles.length > 0) {
        await Promise.all(briefFiles.map(file => api.uploadProjectFile({ projectId: createdProject.id, ownerUid: currentUser.uid, purpose: 'brief', file })));
        await reload();
      }
      setBriefFiles([]);
      setMessage(professional ? `Booking request created with ${professional.name}.` : 'Booking request created for Grihamm operations.');
      setActiveTab('contractors');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not create booking.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mvp-shell">
      <AppTabs activeTab={activeTab} onChange={setActiveTab} />

      <main className="mvp-container">
        <Notice error={error} message={message} />
        {loading && <div className="mvp-empty">Loading Supabase data...</div>}

        {activeTab === 'book' && (
          <>
            <BookingBrief booking={booking} updateBooking={updateBooking} onSubmit={reviewBrief} files={briefFiles} onFiles={setBriefFiles} loading={saving} />
            {briefReady && <RecommendedTeam professionals={data?.professionals || []} projects={data?.projects || []} booking={booking} onBook={professional => void createProject(professional)} />}
          </>
        )}
        {activeTab === 'contractors' && <ProfessionalDirectory data={data} booking={booking} onBook={professional => void createProject(professional)} />}
      </main>

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </div>
  );
};

export default MvpPrototype;
