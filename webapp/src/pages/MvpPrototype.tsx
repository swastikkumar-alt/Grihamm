import { useMemo, useState, type ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import {
  ArrowRight,
  BadgeIndianRupee,
  Check,
  ClipboardCheck,
  FileUp,
  HardHat,
  Home,
  MapPin,
  Star,
  X,
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { api, formatCurrency, type BootstrapData, type Professional, type Project } from '../lib/api';
import { labelKey } from '../i18n';
import { areaTypes, defaultBooking, partnerSpecializations, projectTypes, supportedCities, visitPreferences } from '../lib/platformConfig';
import { useGrihammData } from '../lib/useGrihammData';
import './MvpPrototype.css';

type AppTab = 'book' | 'contractors';

const tabs: { id: AppTab; label: string; icon: ComponentType<{ size?: number }> }[] = [
  { id: 'book', label: 'Book', icon: Home },
  { id: 'contractors', label: 'Contractors', icon: HardHat },
];

const grihammTrustPoints = [
  'Milestone escrow: released only on photo-verified completion.',
  'Every contractor is field-audited by a senior project manager before listing.',
  'Free physical audit on request, with refund support for unfinished work.',
  'No design fees. No call centre. One PM, one WhatsApp thread.',
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

const tx = (t: TFunction, value: string) => t(`taxonomy.${labelKey(value)}`, value);
const txList = (t: TFunction, values: string[]) => values.map(value => tx(t, value)).join(', ');
const hasServiceMatch = (professional: Professional, requestedServices: string[]) =>
  requestedServices.length === 0 || requestedServices.some(service => professional.services.includes(service));
const matchedServices = (professional: Professional, requestedServices: string[]) =>
  requestedServices.filter(service => professional.services.includes(service));

const getProfessionalLoad = (professional: Professional, projects: Project[]) => {
  const activeProjects = projects.filter(project => (
    project.progress < 100
    && !/complete|handover|closed/i.test(project.stage)
    && (project.contractorId === professional.id || project.designerId === professional.id)
  ));
  return activeProjects.length;
};

const getAvailability = (professional: Professional, projects: Project[], selectedStartDate: string, t?: TFunction) => {
  const activeCount = getProfessionalLoad(professional, projects);
  const dateLabel = selectedStartDate ? formatScheduleDate(selectedStartDate) : 'your selected start date';
  if (activeCount > 0) {
    return {
      className: 'busy',
      label: t ? t('contractors.busyNow') : 'On project now',
      detail: t ? t('contractors.slotNeeded', { count: activeCount, date: dateLabel }) : `${activeCount} active Grihamm project${activeCount > 1 ? 's' : ''}. Slot check needed for ${dateLabel}.`,
    };
  }
  return {
    className: 'open',
    label: t ? t('contractors.openNow') : 'Open for new project',
    detail: selectedStartDate ? (t ? t('contractors.canShortlist', { date: dateLabel }) : `Can be shortlisted for ${dateLabel}.`) : (t ? t('contractors.pickStart') : 'Pick a start date to run a slot check.'),
  };
};

const getBudgetFit = (professional: Professional, booking: typeof defaultBooking, t?: TFunction) => {
  if (!professional.startingPrice) {
    return { className: 'review', label: t ? t('contractors.quoteReview') : 'Quote after site review', detail: 'Visible in list; operations will confirm pricing.' };
  }
  const estimate = estimateProfessionalCost(professional, booking.areaSqft);
  const maxBudget = Math.max(booking.budgetMax, 1);
  if (estimate <= maxBudget) {
    return { className: 'fit', label: t ? t('contractors.budgetFit') : 'Budget fit', detail: `${formatCurrency(estimate)} estimate` };
  }
  return { className: 'over', label: t ? t('contractors.aboveBudget') : 'Above selected budget', detail: `${formatCurrency(estimate)} estimate` };
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
  booking.requestedServices.length ? `Requested work: ${booking.requestedServices.join(', ')}` : '',
  booking.desiredStartDate ? `Desired start date: ${formatScheduleDate(booking.desiredStartDate)}` : '',
  booking.targetHandoverDate ? `Target handover date: ${formatScheduleDate(booking.targetHandoverDate)}` : '',
  booking.siteAddress ? `Site address: ${booking.siteAddress}` : '',
  booking.timeline ? `Timeline notes: ${booking.timeline}` : '',
  booking.visitPreference ? `Visit preference: ${booking.visitPreference}` : '',
].filter(Boolean);

const AppTabs = ({ activeTab, onChange }: { activeTab: AppTab; onChange: (tab: AppTab) => void }) => {
  const { t } = useTranslation();
  return (
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
            {t(`booking.tabs.${tab.id}`)}
          </button>
        );
      })}
    </div>
  </nav>
  );
};

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
  professionals,
}: {
  booking: typeof defaultBooking;
  updateBooking: <K extends keyof typeof defaultBooking>(field: K, value: (typeof defaultBooking)[K]) => void;
  onSubmit: () => void;
  files: File[];
  onFiles: (files: File[]) => void;
  loading: boolean;
  professionals: Professional[];
}) => {
  const { t } = useTranslation();
  const handleFileInput = (list: FileList | null) => {
    if (!list) return;
    const nextFiles = Array.from(list)
      .filter(file => allowedFileTypes.some(type => file.type.startsWith(type)))
      .filter(file => file.size <= 8 * 1024 * 1024)
      .slice(0, 8);
    onFiles(nextFiles);
  };
  const selectedProjectType = projectTypes.find(item => item.label === booking.projectType);
  const isCustomSpace = booking.propertySubtype.toLowerCase().startsWith('custom');
  const listedProfessionals = professionals.filter(item => item.status === 'listed');
  const tradeCategoryCount = new Set(listedProfessionals.flatMap(item => item.services)).size;
  const activeCityLabel = booking.city || supportedCities.join(' / ');
  const toggleRequestedService = (service: string) => {
    const nextServices = booking.requestedServices.includes(service)
      ? booking.requestedServices.filter(item => item !== service)
      : [...booking.requestedServices, service];
    updateBooking('requestedServices', nextServices);
  };

  return (
    <section className="mvp-book-grid">
      <div className="mvp-book-main">
        <div className="mvp-book-copy">
          <h1 className="mvp-dream-title">
            Let's <span>build</span> your <span>dream</span>
          </h1>
          <p>
            {t('booking.intro')}
          </p>
        </div>

        <div className="mvp-form-card">
          <div className="mvp-form-grid">
            <label className="mvp-field">
              <span>{t('booking.projectType')}</span>
              <select
                value={booking.projectType}
                onChange={event => {
                  const nextType = projectTypes.find(item => item.label === event.target.value);
                  if (!nextType) return;
                  updateBooking('projectType', event.target.value);
                  updateBooking('propertySubtype', nextType.spaces[0]);
                  updateBooking('customSpace', '');
                  updateBooking('homeType', `${nextType.label} - ${nextType.spaces[0]}`);
                }}
              >
                <option value="" disabled>{t('booking.chooseProjectType')}</option>
                {projectTypes.map(item => <option key={item.label} value={item.label}>{tx(t, item.label)}</option>)}
              </select>
            </label>
            <label className="mvp-field">
              <span>{t('booking.locality')} ({supportedCities.join(' / ')} pilot)</span>
              <select value={booking.city} onChange={event => updateBooking('city', event.target.value)}>
                <option value="" disabled>{t('booking.chooseCity')}</option>
                {supportedCities.map(item => <option key={item}>{item}</option>)}
              </select>
            </label>
          </div>

          <div className="mvp-field">
            <span>{t('booking.spaceType')}</span>
            {selectedProjectType ? (
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
                    {tx(t, option)}
                  </button>
                ))}
              </div>
            ) : (
              <div className="mvp-choice-placeholder">{t('booking.chooseTypeHint')}</div>
            )}
          </div>

          {isCustomSpace && (
            <label className="mvp-field">
              <span>{t('booking.customSpace')}</span>
              <input
                value={booking.customSpace}
                onChange={event => {
                  updateBooking('customSpace', event.target.value);
                  updateBooking('homeType', `${booking.projectType || 'Project'} - ${event.target.value || 'Custom'}`);
                }}
                placeholder={t('booking.customSpacePlaceholder')}
              />
            </label>
          )}

          <div className="mvp-form-grid">
            <label className="mvp-field">
              <span>{t('booking.areaType')}</span>
              <select value={booking.areaType} onChange={event => updateBooking('areaType', event.target.value)}>
                {areaTypes.map(item => <option key={item} value={item}>{tx(t, item)}</option>)}
              </select>
            </label>
            <label className="mvp-field">
              <span>{t('booking.measuredArea')}</span>
              <input type="number" min="0" value={booking.areaSqft || ''} onChange={event => updateBooking('areaSqft', Number(event.target.value))} placeholder="e.g. 1180" />
            </label>
          </div>

          <div className="mvp-budget-line">
            <span>{t('booking.approxBudget')}</span>
            <strong>{formatCurrency(booking.budgetMin)} - {formatCurrency(booking.budgetMax)}</strong>
            <p>{t('booking.budgetHelp')}</p>
          </div>

          <div className="mvp-form-grid">
            <label className="mvp-field">
              <span>{t('booking.minBudget')}</span>
              <input type="number" min="0" value={booking.budgetMin} onChange={event => updateBooking('budgetMin', Number(event.target.value))} />
            </label>
            <label className="mvp-field">
              <span>{t('booking.maxBudget')}</span>
              <input type="number" min="0" value={booking.budgetMax} onChange={event => updateBooking('budgetMax', Number(event.target.value))} />
            </label>
          </div>

          <div className="mvp-field">
            <span>{t('booking.workNeeded')}</span>
            <p className="mvp-field-help">{t('booking.workNeededHelp')}</p>
            <div className="mvp-soft-options mvp-work-options">
              {partnerSpecializations.map(option => (
                <button
                  key={option}
                  type="button"
                  className={booking.requestedServices.includes(option) ? 'active' : ''}
                  onClick={() => toggleRequestedService(option)}
                >
                  {tx(t, option)}
                </button>
              ))}
            </div>
          </div>

          <div className="mvp-form-grid">
            <label className="mvp-field">
              <span>{t('booking.siteAddressOptional')}</span>
              <input value={booking.siteAddress} onChange={event => updateBooking('siteAddress', event.target.value)} placeholder={t('booking.siteAddressPlaceholder')} />
            </label>
            <label className="mvp-field">
              <span>{t('booking.visitPreference')}</span>
              <select value={booking.visitPreference} onChange={event => updateBooking('visitPreference', event.target.value)}>
                {visitPreferences.map(option => <option key={option}>{option}</option>)}
              </select>
            </label>
          </div>

          <div className="mvp-timeline-panel">
            <div className="mvp-timeline-head">
              <span>{t('booking.calendarEyebrow')}</span>
              <strong>{t('booking.calendarTitle')}</strong>
              <p>{t('booking.calendarText')}</p>
            </div>
            <div className="mvp-form-grid mvp-date-grid">
              <label className="mvp-field">
                <span>{t('booking.startDate')}</span>
                <input
                  type="date"
                  min={todayInputValue()}
                  value={booking.desiredStartDate}
                  onChange={event => updateBooking('desiredStartDate', event.target.value)}
                />
              </label>
              <label className="mvp-field">
                <span>{t('booking.handoverDate')}</span>
                <input
                  type="date"
                  min={booking.desiredStartDate || todayInputValue()}
                  value={booking.targetHandoverDate}
                  onChange={event => updateBooking('targetHandoverDate', event.target.value)}
                />
              </label>
            </div>
            <label className="mvp-field">
              <span>{t('booking.timelineNotes')}</span>
              <input value={booking.timeline} onChange={event => updateBooking('timeline', event.target.value)} placeholder={t('booking.timelinePlaceholder')} />
            </label>
            <p className="mvp-date-note">
              {t('booking.dateNote')}
            </p>
          </div>

          <label className="mvp-file-drop">
            <input type="file" accept="image/*,application/pdf" multiple onChange={event => handleFileInput(event.target.files)} />
            <FileUp size={20} />
            <strong>{t('booking.attachTitle')}</strong>
            <span>{t('booking.attachText')}</span>
          </label>

          {files.length > 0 && (
            <div className="mvp-file-list">
              {files.map(file => (
                <span key={`${file.name}-${file.size}`}>{file.name}</span>
              ))}
            </div>
          )}

          <button className="mvp-primary" type="button" disabled={loading} onClick={onSubmit}>
            {loading ? t('booking.checking') : <>{t('booking.seePartners')} <ArrowRight size={15} /></>}
          </button>
        </div>
      </div>

      <aside className="mvp-book-side" aria-label="Grihamm booking standards">
        <section className="mvp-why-card">
          <span>{t('booking.whyEyebrow')}</span>
          <h2>{t('booking.whyTitle')}</h2>
          <ul>
            {grihammTrustPoints.map(item => (
              <li key={item}>
                <Check size={15} />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mvp-snapshot-card">
          <div className="mvp-snapshot-head">
            <span>{t('booking.pilotSnapshot')}</span>
            <small>{t('booking.liveIn', { city: activeCityLabel })}</small>
          </div>
          <div className="mvp-snapshot-metrics">
            <div>
              <strong>{listedProfessionals.length || '-'}</strong>
              <span>{t('common.partners')}</span>
            </div>
            <div>
              <strong>{tradeCategoryCount || '-'}</strong>
              <span>{t('booking.tradeCategories')}</span>
            </div>
            <div>
              <strong>24H</strong>
              <span>{t('booking.pmResponse')}</span>
            </div>
          </div>
        </section>

        <section className="mvp-calendar-card">
          <span>{t('booking.slotCheck')}</span>
          <p>
            {t('booking.slotCheckText')}
          </p>
        </section>
      </aside>
    </section>
  );
};

const RecommendedTeam = ({ professionals, projects, booking, onBook }: { professionals: Professional[]; projects: Project[]; booking: typeof defaultBooking; onBook: (professional: Professional) => void }) => {
  const { t } = useTranslation();
  const listed = professionals.filter(item => (
    item.status === 'listed'
    && item.type === 'Contractor'
    && item.city === booking.city
    && hasServiceMatch(item, booking.requestedServices)
    && estimateProfessionalCost(item, booking.areaSqft) <= Math.max(booking.budgetMax, 1)
  ));
  const recommendedPartner = listed[0] || null;

  return (
    <section className="mvp-section">
      <div className="mvp-section-head">
        <div>
          <h2>{t('booking.recommendedTitle')}</h2>
          <p>{t('booking.recommendedText', { homeType: booking.homeType, city: booking.city })}</p>
        </div>
      </div>

      <div className="mvp-team-grid">
        {!recommendedPartner && <div className="mvp-empty">{t('booking.noMatch')}</div>}
        {recommendedPartner && (
          <article className="mvp-team-card" key={recommendedPartner.id}>
            {(() => {
              const availability = getAvailability(recommendedPartner, projects, booking.desiredStartDate, t);
              return <span className={`mvp-availability ${availability.className}`}>{availability.label}</span>;
            })()}
            <div className="mvp-avatar">{getInitials(recommendedPartner.name)}</div>
            <h3>{recommendedPartner.name}</h3>
            <p>{recommendedPartner.type}</p>
            <span>{txList(t, matchedServices(recommendedPartner, booking.requestedServices).slice(0, 3)) || txList(t, recommendedPartner.services.slice(0, 2)) || recommendedPartner.city}</span>
            <small>{recommendedPartner.experienceYears}+ yrs - {recommendedPartner.clientsServed} clients - {formatCurrency(estimateProfessionalCost(recommendedPartner, booking.areaSqft))}</small>
            {recommendedPartner.languages.length > 0 && <small>{t('contractors.languages')}: {recommendedPartner.languages.join(', ')}</small>}
            {recommendedPartner.monthlyCapacity && <small>{t('contractors.capacity')}: {recommendedPartner.monthlyCapacity}</small>}
            <button className="mvp-primary" type="button" onClick={() => onBook(recommendedPartner)}>{t('booking.bookThisPartner')}</button>
          </article>
        )}
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
  const { t } = useTranslation();
  const [service, setService] = useState('All services');
  const [city, setCity] = useState('All cities');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'open' | 'busy'>('all');
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const projects = data?.projects || [];
  const professionals = useMemo(() => (data?.professionals || []).filter(item => item.type === 'Contractor'), [data?.professionals]);
  const services = useMemo(() => ['All services', ...Array.from(new Set(professionals.flatMap(item => item.services)))], [professionals]);
  const cities = useMemo(() => ['All cities', ...Array.from(new Set([...supportedCities, ...professionals.map(item => item.city).filter(Boolean)]))], [professionals]);
  const filtered = professionals.filter(pro => {
    if (pro.status !== 'listed') return false;
    if (city !== 'All cities' && pro.city !== city) return false;
    if (service !== 'All services' && !pro.services.includes(service)) return false;
    const load = getProfessionalLoad(pro, projects);
    if (availabilityFilter === 'open' && load > 0) return false;
    if (availabilityFilter === 'busy' && load === 0) return false;
    return true;
  }).sort((a, b) => {
    const aFit = getBudgetFit(a, booking, t).className === 'over' ? 1 : 0;
    const bFit = getBudgetFit(b, booking, t).className === 'over' ? 1 : 0;
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
          <h2>{t('contractors.title')}</h2>
          <p>{t('contractors.intro')}</p>
          <small className="mvp-filter-note">{t('contractors.note')}</small>
        </div>
      </div>

      <div className="mvp-directory-layout">
        <aside className="mvp-directory-filter-panel" aria-label="Contractor filters">
          <div>
            <span>{t('contractors.filterEyebrow')}</span>
            <h3>{t('contractors.filterTitle')}</h3>
            <p>{t('contractors.filterCount', { count: filtered.length, city: city === 'All cities' ? t('contractors.allCities') : city })}</p>
          </div>
          <label className="mvp-filter-field">
            <span>{t('common.city')}</span>
            <select value={city} onChange={event => setCity(event.target.value)}>
              {cities.map(item => <option key={item} value={item}>{item === 'All cities' ? t('contractors.allCities') : item}</option>)}
            </select>
          </label>
          <label className="mvp-filter-field">
            <span>{t('common.service')}</span>
            <select value={service} onChange={event => setService(event.target.value)}>
              {services.map(item => <option key={item} value={item}>{item === 'All services' ? t('contractors.allServices') : tx(t, item)}</option>)}
            </select>
          </label>
          <label className="mvp-filter-field">
            <span>{t('contractors.availability')}</span>
            <select value={availabilityFilter} onChange={event => setAvailabilityFilter(event.target.value as typeof availabilityFilter)}>
              <option value="all">{t('contractors.allAvailability')}</option>
              <option value="open">{t('contractors.availableOnly')}</option>
              <option value="busy">{t('contractors.busyOnly')}</option>
            </select>
          </label>
          <div className="mvp-filter-summary">
            <strong>{booking.desiredStartDate ? formatScheduleDate(booking.desiredStartDate) : t('contractors.pickStart')}</strong>
            <span>{t('booking.dateNote')}</span>
          </div>
        </aside>

        <div className="mvp-directory">
          {filtered.length === 0 && <div className="mvp-empty">{t('contractors.noFiltered')}</div>}
          {filtered.map(pro => (
            <article className="mvp-pro-card" key={pro.id} onClick={() => setSelectedProfessional(pro)}>
              {pro.grihammCertified && <span className="mvp-certified"><Star size={13} fill="currentColor" /> {t('contractors.certified')}</span>}
              <div className="mvp-pro-head">
                <div className="mvp-avatar">{getInitials(pro.name)}</div>
                <div>
                  <h3>{pro.name}</h3>
                  <p><MapPin size={14} /> {pro.city} - {pro.type === 'Contractor' ? t('common.contractor') : t('common.designer')}</p>
                </div>
              </div>
              {(() => {
                const availability = getAvailability(pro, projects, booking.desiredStartDate, t);
                const budgetFit = getBudgetFit(pro, booking, t);
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
                {matchedServices(pro, booking.requestedServices).length > 0 && <span>{t('booking.workNeeded')}: {txList(t, matchedServices(pro, booking.requestedServices))}</span>}
                {pro.languages.length > 0 && <span>{t('contractors.languages')}: {pro.languages.join(', ')}</span>}
                {pro.serviceAreas.length > 0 && <span>{t('contractors.serviceAreas')}: {pro.serviceAreas.join(', ')}</span>}
                {pro.monthlyCapacity && <span>{t('contractors.capacity')}: {pro.monthlyCapacity}</span>}
                {pro.teamSize > 0 && <span>{t('contractors.teamSize')}: {pro.teamSize}</span>}
                {pro.warrantyPolicy && <span>{t('contractors.warranty')}: {pro.warrantyPolicy}</span>}
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
                <div className="mvp-gallery-empty">{t('contractors.imagesPending')}</div>
              )}
              <div className="mvp-pro-actions">
                <button className="mvp-secondary" type="button" onClick={event => { event.stopPropagation(); setSelectedProfessional(pro); }}>{t('contractors.viewDetails')}</button>
                <button className="mvp-primary" type="button" onClick={event => { event.stopPropagation(); onBook(pro); }}>{t('contractors.book')}</button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {selectedProfessional && (
        <div className="mvp-modal-backdrop" onClick={() => setSelectedProfessional(null)}>
          <section className="mvp-modal" role="dialog" aria-modal="true" onClick={event => event.stopPropagation()}>
            <button className="mvp-modal-close" type="button" aria-label="Close" onClick={() => setSelectedProfessional(null)}><X size={18} /></button>
            <div className="mvp-pro-head">
              <div className="mvp-avatar large">{getInitials(selectedProfessional.name)}</div>
              <div>
                <h2>{selectedProfessional.name}</h2>
                <p>{selectedProfessional.type === 'Contractor' ? t('common.contractor') : t('common.designer')} in {selectedProfessional.city}</p>
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
              <div><span>{t('contractors.startingPrice')}</span><strong>{selectedProfessional.startingPrice ? `${formatCurrency(selectedProfessional.startingPrice)} ${selectedProfessional.priceUnit}` : selectedProfessional.priceUnit}</strong></div>
              <div><span>{t('contractors.estimate')}</span><strong>{selectedProfessional.startingPrice ? formatCurrency(estimateProfessionalCost(selectedProfessional, booking.areaSqft)) : 'Needs site review'}</strong></div>
              <div><span>{t('contractors.gstin')}</span><strong>{selectedProfessional.gstin || t('common.pending')}</strong></div>
              <div><span>{t('contractors.academy')}</span><strong>{selectedProfessional.grihammCertified ? selectedProfessional.academyCredential || 'Verified' : 'Not certified'}</strong></div>
              <div><span>{t('contractors.languages')}</span><strong>{selectedProfessional.languages.join(', ') || t('common.notAdded')}</strong></div>
              <div><span>{t('contractors.teamSize')}</span><strong>{selectedProfessional.teamSize || t('common.notAdded')}</strong></div>
            </div>
            <div className="mvp-partner-value">
              <h3>{t('contractors.strengths')}</h3>
              {getPartnerStrengths(selectedProfessional).map(item => <span key={item}>{item}</span>)}
              {selectedProfessional.serviceAreas.length > 0 && <span>{t('contractors.serviceAreas')}: {selectedProfessional.serviceAreas.join(', ')}</span>}
              {selectedProfessional.monthlyCapacity && <span>{t('contractors.capacity')}: {selectedProfessional.monthlyCapacity}</span>}
              {selectedProfessional.warrantyPolicy && <span>{t('contractors.warranty')}: {selectedProfessional.warrantyPolicy}</span>}
              {selectedProfessional.materialBrands.length > 0 && <span>{t('contractors.materialBrands')}: {selectedProfessional.materialBrands.join(', ')}</span>}
              <span>{getAvailability(selectedProfessional, projects, booking.desiredStartDate, t).detail}</span>
            </div>
            <div className="mvp-chip-row">{selectedProfessional.services.map(item => <span key={item}>{tx(t, item)}</span>)}</div>
            <button className="mvp-primary" type="button" onClick={() => onBook(selectedProfessional)}>{t('booking.bookThisPartner')}</button>
          </section>
        </div>
      )}
    </section>
  );
};

const MvpPrototype = () => {
  const { t, i18n } = useTranslation();
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
  const selectedSubtype = booking.propertySubtype.toLowerCase().startsWith('custom')
    ? booking.customSpace.trim() || 'Custom requirement'
    : booking.propertySubtype.trim() || 'Custom requirement';

  const updateBooking = <K extends keyof typeof defaultBooking>(field: K, value: (typeof defaultBooking)[K]) => {
    setBooking(prev => ({ ...prev, [field]: value }));
    setBriefReady(false);
  };

  const validateBrief = () => {
    if (!booking.projectType.trim()) return t('booking.validation.projectType');
    if (!selectedSubtype.trim() || selectedSubtype === 'Custom requirement') return t('booking.validation.subtype');
    if (!booking.city.trim()) return t('booking.validation.city');
    if (!booking.areaSqft || booking.areaSqft < 100) return t('booking.validation.area');
    if (!booking.budgetMax || booking.budgetMax < booking.budgetMin) return t('booking.validation.budget');
    if (booking.requestedServices.length === 0) return t('booking.validation.work');
    if (!booking.desiredStartDate) return t('booking.validation.start');
    if (booking.targetHandoverDate && booking.targetHandoverDate < booking.desiredStartDate) return t('booking.validation.handover');
    return '';
  };

  const reviewBrief = () => {
    const validationMessage = validateBrief();
    if (validationMessage) {
      setMessage(validationMessage);
      setBriefReady(false);
      return;
    }
    setMessage(t('booking.ready'));
    setBriefReady(true);
  };

  const requireLogin = (action: string) => {
    if (currentUser) return true;
    setMessage(t('booking.loginToAction', { action }));
    setIsAuthModalOpen(true);
    return false;
  };

  const createProject = async (professional: Professional) => {
    if (professional.type !== 'Contractor') {
      setMessage(t('booking.contractorOnly'));
      return;
    }
    if (!requireLogin(t('booking.actions.bookProfessional')) || !currentUser) return;
    setSaving(true);
    setMessage('');
    try {
      const scope = buildProjectScope(selectedPropertyLabel, selectedSubtype, booking.areaType, booking.areaSqft, booking.budgetMin, booking.budgetMax, booking);
      const scopedBrief = [
        ...scope,
        professional ? t('booking.requestedProfessional', { name: professional.name }) : '',
      ].filter(Boolean);
      const nextData = await api.createProject({
        customerUid: currentUser.uid,
        customerName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Grihamm customer',
        city: booking.city,
        homeType: `${selectedPropertyLabel} - ${selectedSubtype}`,
        projectType: selectedPropertyLabel,
        propertySubtype: selectedSubtype,
        areaType: booking.areaType,
        areaSqft: booking.areaSqft,
        budget: booking.budgetMax,
        budgetMin: booking.budgetMin,
        budgetMax: booking.budgetMax,
        requestedServices: booking.requestedServices,
        siteAddress: booking.siteAddress,
        visitPreference: booking.visitPreference,
        preferredLanguage: i18n.language,
        briefNotes: booking.timeline,
        scope: scopedBrief,
        designerId: null,
        contractorId: professional.id,
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
      setMessage(t('booking.requestCreatedWith', { name: professional.name }));
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

      <main id="start-project" className="mvp-container">
        <Notice error={error} message={message} />
        {loading && <div className="mvp-empty">Loading Supabase data...</div>}

        {activeTab === 'book' && (
          <>
            <BookingBrief booking={booking} updateBooking={updateBooking} onSubmit={reviewBrief} files={briefFiles} onFiles={setBriefFiles} loading={saving} professionals={data?.professionals || []} />
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
