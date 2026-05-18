import { useMemo, useState } from 'react';
import {
  BadgeIndianRupee,
  Building2,
  Camera,
  ClipboardCheck,
  Filter,
  GraduationCap,
  MapPin,
  ShieldCheck,
  Star,
  X,
} from 'lucide-react';
import AuthModal from '../components/AuthModal';
import { useAuth } from '../contexts/AuthContext';
import { api, formatCurrency, type Professional, type ProfessionalType } from '../lib/api';
import { areaTypes, defaultBooking, propertyCategories, supportedCities } from '../lib/platformConfig';
import { useGrihammData } from '../lib/useGrihammData';
import './MvpPrototype.css';

const EMPTY_PROFESSIONALS: Professional[] = [];

const MvpPrototype = () => {
  const { currentUser } = useAuth();
  const { data, loading, error, replaceData } = useGrihammData();
  const [type, setType] = useState<'All' | ProfessionalType>('All');
  const [service, setService] = useState('All services');
  const [minRating, setMinRating] = useState(0);
  const [minClients, setMinClients] = useState(0);
  const [gstinOnly, setGstinOnly] = useState(false);
  const [portfolioOnly, setPortfolioOnly] = useState(false);
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [booking, setBooking] = useState(defaultBooking);
  const [message, setMessage] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);

  const professionals = data?.professionals || EMPTY_PROFESSIONALS;
  const selectedCategory = propertyCategories.find(item => item.id === booking.propertyCategory) || propertyCategories[0];
  const selectedPropertyLabel = selectedCategory.id === 'all' ? 'Property project' : selectedCategory.label;
  const selectedSubtype = selectedCategory.id === 'all' ? 'General requirement' : booking.propertySubtype;
  const services = useMemo(() => (
    ['All services', ...Array.from(new Set([...selectedCategory.services, ...professionals.flatMap(item => item.services)]))]
  ), [professionals, selectedCategory.services]);

  const estimateProfessionalCost = (professional: Professional) => {
    if (professional.priceUnit.toLowerCase().includes('sqft')) {
      return professional.startingPrice * Math.max(Number(booking.areaSqft) || 1, 1);
    }
    return professional.startingPrice;
  };

  const filteredProfessionals = professionals.filter(professional => {
    if (professional.status !== 'listed') return false;
    if (professional.city !== booking.city) return false;
    if (type !== 'All' && professional.type !== type) return false;
    if (service !== 'All services' && !professional.services.includes(service)) return false;
    if (service === 'All services' && selectedCategory.services.length > 0 && !professional.services.some(item => selectedCategory.services.includes(item))) return false;
    if (minRating > 0 && professional.rating < minRating) return false;
    if (minClients > 0 && professional.clientsServed < minClients) return false;
    if (gstinOnly && !professional.gstin) return false;
    if (portfolioOnly && professional.portfolioImages.length === 0) return false;
    if (certifiedOnly && !professional.grihammCertified) return false;
    const estimatedCost = estimateProfessionalCost(professional);
    if (booking.budgetMax > 0 && estimatedCost > booking.budgetMax) return false;
    return true;
  });

  const updateBooking = <K extends keyof typeof defaultBooking>(field: K, value: (typeof defaultBooking)[K]) => {
    setBooking(prev => ({ ...prev, [field]: value }));
  };

  const updatePropertyCategory = (categoryId: string) => {
    const category = propertyCategories.find(item => item.id === categoryId) || propertyCategories[0];
    setBooking(prev => ({
      ...prev,
      propertyCategory: category.id,
      propertySubtype: category.subtypes[0],
      homeType: category.id === 'all' ? 'Property project - General requirement' : `${category.label} - ${category.subtypes[0]}`,
    }));
    setService('All services');
  };

  const updatePropertySubtype = (subtype: string) => {
    setBooking(prev => ({
      ...prev,
      propertySubtype: subtype,
      homeType: `${selectedPropertyLabel} - ${subtype}`,
    }));
  };

  const resetFilters = () => {
    setBooking(defaultBooking);
    setType('All');
    setService('All services');
    setMinRating(0);
    setMinClients(0);
    setGstinOnly(false);
    setPortfolioOnly(false);
    setCertifiedOnly(false);
  };

  const buildScope = () => [
    `${selectedPropertyLabel}: ${selectedSubtype}`,
    `${booking.areaType}: ${booking.areaSqft} sqft`,
    `Budget range: ${formatCurrency(booking.budgetMin)} - ${formatCurrency(booking.budgetMax)}`,
  ];

  const getCustomerName = () => (
    currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Grihamm customer'
  );

  const requireLogin = (action: string) => {
    if (currentUser) return true;
    setMessage(`Login to ${action}. You can keep exploring professionals without signing in.`);
    setIsAuthModalOpen(true);
    return false;
  };

  const createProject = async (professional?: Professional) => {
    if (!requireLogin(professional ? 'book this professional' : 'create a booking request')) {
      return;
    }

    const nextData = await api.createProject({
      customerName: getCustomerName(),
      city: booking.city,
      homeType: `${selectedPropertyLabel} - ${selectedSubtype}`,
      budget: booking.budgetMax,
      scope: buildScope(),
      designerId: professional?.type === 'Interior Designer' ? professional.id : null,
      contractorId: professional?.type === 'Contractor' ? professional.id : null,
    });
    replaceData(nextData);
    setBooking(defaultBooking);
    setMessage(professional ? `Booking request created with ${professional.name}.` : 'Booking request created for Grihamm operations.');
  };

  const requestGrihammAudit = async () => {
    if (!requireLogin('request a Grihamm audit')) {
      return;
    }

    const projectData = await api.createProject({
      customerName: getCustomerName(),
      city: booking.city,
      homeType: `${selectedPropertyLabel} - ${selectedSubtype}`,
      budget: booking.budgetMax,
      scope: ['Grihamm site audit', ...buildScope()],
      designerId: null,
      contractorId: null,
    });
    const createdProject = projectData.projects[0];
    const nextData = await api.createAuditRequest({
      projectId: createdProject.id,
      requestedBy: getCustomerName(),
      reason: `Independent site audit for ${selectedPropertyLabel} - ${selectedSubtype}`,
      preferredSlot: '',
    });
    replaceData(nextData);
    setBooking(defaultBooking);
    setMessage(`Grihamm audit requested for ${formatCurrency(nextData.auditPrice)}. The team can now schedule a site visit.`);
  };

  return (
    <div className="market-shell">
      <div className="market-container">
        <section className="market-hero">
          <div>
            <span className="kicker">Marketplace</span>
            <h1>Find your perfect professional</h1>
            <p>
              Browse verified designers and contractors. Filter by city, budget, and property type — then book with confidence.
            </p>
          </div>
        </section>

        {error && (
          <div className="market-warning">
            Check your Supabase environment variables and run the Supabase migration, then refresh this page. {error}
          </div>
        )}

        {message && <div className="market-note market-status-note">{message}</div>}

        <section className="market-layout">
          <aside className="market-sidebar">
            <div className="market-panel">
              <div className="market-panel-title"><Filter size={18} /> Project filters</div>
              <label>
                Property category
                <select value={booking.propertyCategory} onChange={event => updatePropertyCategory(event.target.value)}>
                  {propertyCategories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}
                </select>
              </label>
              <label>
                {selectedCategory.id === 'home' ? 'Home type' : 'Space type'}
                <select value={booking.propertySubtype} onChange={event => updatePropertySubtype(event.target.value)}>
                  {selectedCategory.subtypes.map(item => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label>
                City
                <select value={booking.city} onChange={event => updateBooking('city', event.target.value)}>
                  {supportedCities.map(item => <option key={item}>{item}</option>)}
                </select>
              </label>
              <div className="market-field-grid">
                <label>
                  Area type
                  <select value={booking.areaType} onChange={event => updateBooking('areaType', event.target.value)}>
                    {areaTypes.map(item => <option key={item}>{item}</option>)}
                  </select>
                </label>
                <label>
                  Area sq ft
                  <input type="number" min="0" value={booking.areaSqft} onChange={event => updateBooking('areaSqft', Number(event.target.value))} />
                </label>
              </div>
              <div className="market-field-grid">
                <label>
                  Min budget
                  <input type="number" min="0" value={booking.budgetMin} onChange={event => updateBooking('budgetMin', Number(event.target.value))} />
                </label>
                <label>
                  Max budget
                  <input type="number" min="0" value={booking.budgetMax} onChange={event => updateBooking('budgetMax', Number(event.target.value))} />
                </label>
              </div>
              <label>
                Professional type
                <select value={type} onChange={event => setType(event.target.value as 'All' | ProfessionalType)}>
                  <option>All</option>
                  <option>Interior Designer</option>
                  <option>Contractor</option>
                </select>
              </label>
              <label>
                Service
                <select value={service} onChange={event => setService(event.target.value)}>
                  {services.map(item => <option key={item}>{item}</option>)}
                </select>
              </label>
              <div className="market-field-grid">
                <label>
                  Min rating
                  <select value={minRating} onChange={event => setMinRating(Number(event.target.value))}>
                    <option value={0}>Any</option>
                    <option value={4}>4.0+</option>
                    <option value={4.5}>4.5+</option>
                    <option value={4.8}>4.8+</option>
                  </select>
                </label>
                <label>
                  Min clients
                  <input type="number" min="0" value={minClients} onChange={event => setMinClients(Number(event.target.value))} />
                </label>
              </div>
              <label className="market-checkbox">
                <input type="checkbox" checked={gstinOnly} onChange={event => setGstinOnly(event.target.checked)} />
                GSTIN verified only
              </label>
              <label className="market-checkbox">
                <input type="checkbox" checked={portfolioOnly} onChange={event => setPortfolioOnly(event.target.checked)} />
                Has past work images
              </label>
              <label className="market-checkbox">
                <input type="checkbox" checked={certifiedOnly} onChange={event => setCertifiedOnly(event.target.checked)} />
                Grihamm certified only
              </label>
              <button className="market-button secondary" onClick={resetFilters}>Reset filters</button>
            </div>
          </aside>

          <main className="market-main">
            <div className="market-section-head">
              <div>
                <span className="kicker">Professionals</span>
                <h2>{loading ? 'Loading professionals...' : `${filteredProfessionals.length} matches`}</h2>
              </div>
            </div>

            <div className="market-grid">
              {filteredProfessionals.map(professional => (
                <article
                  className={`pro-card${professional.grihammCertified ? ' pro-card-verified' : ''}`}
                  key={professional.id}
                  onClick={() => setSelectedProfessional(professional)}
                >
                  {professional.grihammCertified && (
                    <div className="pro-verified-badge">
                      <Star size={12} fill="currentColor" /> Grihamm Verified
                    </div>
                  )}
                  <div className="pro-card-head">
                    <div className="pro-avatar">{professional.name.slice(0, 2).toUpperCase()}</div>
                    <div>
                      <h3>{professional.name}</h3>
                      <div className="pro-muted"><Building2 size={14} /> {professional.type}</div>
                      <div className="pro-muted"><MapPin size={14} /> {professional.city}</div>
                    </div>
                  </div>
                  <p>{professional.bio}</p>
                  <div className="pro-meta">
                    <span><Star size={15} fill="currentColor" /> {professional.rating.toFixed(1)} ({professional.reviewCount})</span>
                    <span><BadgeIndianRupee size={15} /> {formatCurrency(professional.startingPrice)} {professional.priceUnit}</span>
                    <span><BadgeIndianRupee size={15} /> Est. {formatCurrency(estimateProfessionalCost(professional))}</span>
                    <span><ClipboardCheck size={15} /> {professional.clientsServed} Grihamm clients</span>
                    {professional.gstin && <span><ShieldCheck size={15} /> GSTIN verified</span>}
                    {professional.grihammCertified && <span className="pro-certified"><GraduationCap size={15} /> Grihamm Certified</span>}
                  </div>
                  {professional.portfolioImages.length > 0 && (
                    <div className="pro-gallery">
                      {professional.portfolioImages.slice(0, 3).map(image => (
                        <div className="pro-gallery-tile" key={image}>
                          <Camera size={20} />
                          <img
                            src={image}
                            alt=""
                            title={`${professional.name} past work`}
                            onError={event => { event.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pro-services">
                    {professional.services.map(item => <span key={item}>{item}</span>)}
                  </div>
                  <div className="pro-card-actions">
                    <button
                      className="market-button secondary"
                      onClick={event => {
                        event.stopPropagation();
                        setSelectedProfessional(professional);
                      }}
                    >
                      View details
                    </button>
                    <button
                      className="market-button primary"
                      onClick={event => {
                        event.stopPropagation();
                        void createProject(professional);
                      }}
                    >
                      Book
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </main>
        </section>

        {selectedProfessional && (
          <div className="pro-detail-backdrop" onClick={() => setSelectedProfessional(null)}>
            <section
              className="pro-detail"
              aria-modal="true"
              role="dialog"
              aria-labelledby="pro-detail-title"
              onClick={event => event.stopPropagation()}
            >
              <button className="pro-detail-close" aria-label="Close professional details" onClick={() => setSelectedProfessional(null)}>
                <X size={20} />
              </button>
              <div className="pro-detail-head">
                <div className="pro-avatar large">{selectedProfessional.name.slice(0, 2).toUpperCase()}</div>
                <div>
                  <span className="kicker">Professional profile</span>
                  <h2 id="pro-detail-title">{selectedProfessional.name}</h2>
                  <div className="pro-detail-sub">
                    <span><Building2 size={15} /> {selectedProfessional.type}</span>
                    <span><MapPin size={15} /> {selectedProfessional.city}</span>
                    <span><Star size={15} fill="currentColor" /> {selectedProfessional.rating.toFixed(1)} from {selectedProfessional.reviewCount} reviews</span>
                    {selectedProfessional.grihammCertified && <span className="pro-certified"><GraduationCap size={15} /> Grihamm Certified</span>}
                  </div>
                </div>
              </div>

              {selectedProfessional.portfolioImages.length > 0 && (
                <div className="pro-detail-gallery">
                  {selectedProfessional.portfolioImages.slice(0, 6).map(image => (
                    <div className="pro-gallery-tile" key={image}>
                      <Camera size={22} />
                      <img
                        src={image}
                        alt=""
                        title={`${selectedProfessional.name} past work`}
                        onError={event => { event.currentTarget.style.display = 'none'; }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className="pro-detail-metrics">
                <div>
                  <span>Starting price</span>
                  <strong>{formatCurrency(selectedProfessional.startingPrice)} {selectedProfessional.priceUnit}</strong>
                </div>
                <div>
                  <span>Estimate for this brief</span>
                  <strong>{formatCurrency(estimateProfessionalCost(selectedProfessional))}</strong>
                </div>
                <div>
                  <span>Grihamm clients</span>
                  <strong>{selectedProfessional.clientsServed}</strong>
                </div>
                <div>
                  <span>GSTIN</span>
                  <strong>{selectedProfessional.gstin || 'Pending'}</strong>
                </div>
                <div>
                  <span>Academy credential</span>
                  <strong>{selectedProfessional.grihammCertified ? selectedProfessional.academyCredential || 'Grihamm Academy verified' : 'Not certified'}</strong>
                </div>
              </div>

              <div className="pro-detail-body">
                <div>
                  <h3>Profile</h3>
                  <p>{selectedProfessional.bio}</p>
                  <p>{selectedProfessional.experienceYears}+ years experience serving residential, corporate, and commercial requirements.</p>
                </div>
                <div>
                  <h3>Service areas</h3>
                  <div className="pro-detail-chip-list">
                    {selectedProfessional.serviceAreas.map(item => <span key={item}>{item}</span>)}
                  </div>
                </div>
                <div>
                  <h3>Services</h3>
                  <div className="pro-detail-chip-list">
                    {selectedProfessional.services.map(item => <span key={item}>{item}</span>)}
                  </div>
                </div>
              </div>

              <div className="pro-detail-actions">
                <button className="market-button primary" onClick={() => void createProject(selectedProfessional)}>
                  Book this professional
                </button>
                <button className="market-button secondary" onClick={() => void requestGrihammAudit()}>
                  Request Grihamm audit
                </button>
              </div>
            </section>
          </div>
        )}

        <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      </div>
    </div>
  );
};

export default MvpPrototype;
