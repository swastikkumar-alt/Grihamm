import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

export const supportedLanguageOptions = [
  { code: 'en', label: 'English', nativeLabel: 'English' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी' },
  { code: 'kn', label: 'Kannada', nativeLabel: 'ಕನ್ನಡ' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी' },
  { code: 'ta', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { code: 'te', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം' },
  { code: 'gu', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
  { code: 'pa', label: 'Punjabi', nativeLabel: 'ਪੰਜਾਬੀ' },
  { code: 'bn', label: 'Bengali', nativeLabel: 'বাংলা' },
  { code: 'ur', label: 'Urdu', nativeLabel: 'اردو' },
  { code: 'or', label: 'Odia', nativeLabel: 'ଓଡ଼ିଆ' },
  { code: 'as', label: 'Assamese', nativeLabel: 'অসমীয়া' },
  { code: 'ne', label: 'Nepali', nativeLabel: 'नेपाली' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español' },
  { code: 'fr', label: 'French', nativeLabel: 'Français' },
  { code: 'de', label: 'German', nativeLabel: 'Deutsch' },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية' },
  { code: 'zh', label: 'Chinese', nativeLabel: '中文' },
  { code: 'ja', label: 'Japanese', nativeLabel: '日本語' },
  { code: 'ko', label: 'Korean', nativeLabel: '한국어' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português' },
  { code: 'ru', label: 'Russian', nativeLabel: 'Русский' },
] as const;

export type SupportedLanguage = string;

export const isSupportedLanguage = (value: string | null | undefined): value is SupportedLanguage =>
  Boolean(value && /^[a-z]{2,3}(-[a-z0-9]+)*$/i.test(value));

export const resolveLanguage = (value?: string | null): SupportedLanguage => {
  if (isSupportedLanguage(value)) return value;
  return 'en';
};

const machineTranslationApiBase = import.meta.env.VITE_TRANSLATION_API_BASE || '/api/translations';
const machineTranslationCacheKey = (language: SupportedLanguage) => `grihamm-i18n-cache:${language}`;

const loadMachineTranslations = async (language: SupportedLanguage) => {
  if (language === 'en') return;

  const cached = localStorage.getItem(machineTranslationCacheKey(language));
  if (cached) {
    i18n.addResourceBundle(language, 'translation', JSON.parse(cached), true, true);
    return;
  }

  const response = await fetch(`${machineTranslationApiBase}/${encodeURIComponent(language)}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sourceLanguage: 'en', resources: en }),
  });

  if (!response.ok) {
    throw new Error(`Translation provider returned ${response.status}.`);
  }

  const payload = await response.json() as { resources?: unknown };
  if (!payload.resources || typeof payload.resources !== 'object') return;

  localStorage.setItem(machineTranslationCacheKey(language), JSON.stringify(payload.resources));
  i18n.addResourceBundle(language, 'translation', payload.resources, true, true);
};

export const setAppLanguage = async (language: SupportedLanguage) => {
  const nextLanguage = resolveLanguage(language);
  localStorage.setItem('grihamm-language', nextLanguage);
  try {
    await loadMachineTranslations(nextLanguage);
  } catch (error) {
    console.warn('Machine translation unavailable; using English fallback.', error);
  }
  await i18n.changeLanguage(nextLanguage);
  document.documentElement.lang = nextLanguage;
};

export const labelKey = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/\+/g, 'plus')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const common = {
  loading: 'Loading Grihamm...',
  save: 'Save',
  saving: 'Saving...',
  back: 'Back',
  submit: 'Submit',
  close: 'Close',
  optional: 'optional',
  required: 'required',
  notAdded: 'Not added',
  none: 'None',
  pending: 'Pending',
  listed: 'Listed',
  paused: 'Paused',
  all: 'All',
  city: 'City',
  service: 'Service',
  project: 'Project',
  role: 'Role',
  phone: 'Phone',
  email: 'Email',
  language: 'Language',
  profile: 'Profile',
  wallet: 'Wallet',
  contractor: 'Contractor',
  designer: 'Interior Designer',
  partner: 'Partner',
  partners: 'Partners',
  customer: 'Customer',
  admin: 'Admin',
  amount: 'Amount',
  status: 'Status',
  date: 'Date',
  details: 'Details',
  and: 'and',
};

const en = {
  common,
  nav: {
    login: 'Login',
    consult: 'Start a project',
    signedInAs: 'Signed in as',
    profileSettings: 'Profile settings',
    dashboard: 'Dashboard',
    adminPanel: 'Admin panel',
    professionalOS: 'Professional OS',
    signOut: 'Sign out',
    walletHint: 'Escrow balance across your active projects.',
    walletOpen: 'Open dashboard to add funds or review milestone releases.',
    partnerBandTitle: 'Work on verified Grihamm projects.',
    partnerBandText: 'Contractors and designers can submit service areas, capacity, portfolio work, GST details, references, and audit-ready project details for review.',
    partnerBandCta: 'Partner with us',
    footerSocial: 'Social',
    footerStandards: 'Standards',
    footerContact: 'Contact',
    footerCertification: 'Certification review',
    footerAudits: 'Site quality audits',
    footerRights: 'Copyright 2026 Grihamm. All rights reserved.',
    terms: 'Terms',
    privacy: 'Privacy',
    about: 'About us',
    home: 'Home',
    callGrihamm: 'Call Grihamm',
    emailGrihamm: 'Email Grihamm',
  },
  booking: {
    tabs: { book: 'Book', contractors: 'Contractors' },
    title: "Let's build your dream",
    intro: 'A senior project manager will review your brief within 24 hours. No design fees. Funds stay in your wallet until each milestone is photo-verified.',
    projectType: 'Project type',
    chooseProjectType: 'Choose project type',
    locality: 'Locality',
    chooseCity: 'Choose city',
    spaceType: 'Home or space type',
    chooseTypeHint: 'Choose a project type to load relevant space options.',
    customSpace: 'Custom space details',
    customSpacePlaceholder: 'e.g. 5,200 sq ft restaurant, duplex renovation, 12-seat clinic',
    areaType: 'Area type',
    measuredArea: 'Measured area (sq ft)',
    approxBudget: 'Approx. budget',
    budgetHelp: 'Released milestone-by-milestone. You always control the wallet.',
    minBudget: 'Minimum budget',
    maxBudget: 'Maximum budget',
    workNeeded: 'Work needed',
    workNeededHelp: 'Choose the trades or services you want. We match this with partner specializations.',
    siteAddress: 'Site address',
    siteAddressOptional: 'Site address (optional)',
    siteAddressPlaceholder: 'Apartment, area, landmark',
    visitPreference: 'Visit preference',
    calendarEyebrow: 'Calendar-aware matching',
    calendarTitle: 'Choose your project window.',
    calendarText: 'We check contractor load before shortlisting, so active projects do not collide with your start date.',
    startDate: 'When do you want to start?',
    handoverDate: 'Target handover date',
    timelineNotes: 'Timeline notes',
    timelinePlaceholder: 'e.g. weekdays only, society work hours, phased handover',
    dateNote: 'We use these calendar dates to avoid shortlisting contractors who already have active Grihamm projects in the same window.',
    attachTitle: 'Tell us more with plans or photos (optional)',
    attachText: 'Attach floor plans, current photos, references, or BOQs. Images and PDFs can be up to 8 MB each.',
    checking: 'Checking brief...',
    seePartners: 'See contractors near you',
    whyTitle: 'Your money stays in your wallet.',
    whyEyebrow: 'Why Grihamm',
    pilotSnapshot: 'Pilot snapshot',
    liveIn: 'Live in {{city}}',
    tradeCategories: 'trade categories',
    pmResponse: 'PM response',
    slotCheck: 'Slot check',
    slotCheckText: 'Pick start and handover dates in the form. Contractors already carrying active Grihamm work are shown with their current load before booking.',
    recommendedTitle: 'Recommended contractor for this brief',
    recommendedText: '{{homeType}} in {{city}}. The first match is filtered from listed Supabase contractors by city, work type, budget, availability, and project load.',
    createRequest: 'Create request',
    noMatch: 'No listed contractor matches this brief yet. Adjust the brief or use the Contractors tab to choose an available contractor.',
    bookThisPartner: 'Book this contractor',
    requestedProfessional: 'Requested contractor: {{name}}',
    requestCreatedWith: 'Booking request created with {{name}}.',
    requestCreated: 'Booking request created.',
    contractorOnly: 'Customers can only book listed contractors.',
    loginToAction: 'Login to {{action}}. Browsing professionals stays open.',
    validation: {
      projectType: 'Choose a project type.',
      subtype: 'Choose or describe the space size.',
      city: 'Choose a city.',
      area: 'Enter a valid area.',
      budget: 'Enter a valid budget range.',
      work: 'Choose at least one type of work needed.',
      start: 'Select when you want the project to start.',
      handover: 'Target handover cannot be before the start date.',
    },
    ready: 'Brief ready. Showing recommended contractors from listed partners.',
    actions: { bookProfessional: 'book this contractor', createBooking: 'create a booking request' },
  },
  contractors: {
    title: 'Partners',
    intro: 'Browse live contractor listings by city, trade, price, verification, language coverage, and active project load.',
    note: 'Approved contractors stay visible even when they are above the current budget; cards show the reason instead of silently hiding them.',
    filterTitle: 'Match by trade and availability.',
    filterEyebrow: 'Filter partners',
    filterCount: '{{count}} partner available across {{city}}.',
    filterCount_plural: '{{count}} partners available across {{city}}.',
    allServices: 'All services',
    allCities: 'All cities',
    partnerType: 'Partner type',
    availability: 'Availability',
    allAvailability: 'All availability',
    availableOnly: 'Open for new project',
    busyOnly: 'On project now',
    noFiltered: 'No listed contractors match these filters yet. Adjust the service, city, or availability filter.',
    certified: 'Certified',
    viewDetails: 'View details',
    book: 'Book',
    activeLoad: 'Active load',
    languages: 'Languages',
    serviceAreas: 'Service areas',
    capacity: 'Monthly capacity',
    teamSize: 'Team size',
    warranty: 'Warranty',
    materialBrands: 'Material brands',
    gstin: 'GSTIN',
    academy: 'Academy',
    startingPrice: 'Starting price',
    estimate: 'Estimate',
    strengths: 'What they bring to the table',
    imagesPending: 'Past-work images pending verification',
    imagePending: 'Image pending verification',
    budgetFit: 'Budget fit',
    aboveBudget: 'Above selected budget',
    quoteReview: 'Quote after site review',
    openNow: 'Open for new project',
    busyNow: 'On project now',
    slotNeeded: '{{count}} active Grihamm project. Slot check needed for {{date}}.',
    slotNeeded_plural: '{{count}} active Grihamm projects. Slot check needed for {{date}}.',
    canShortlist: 'Can be shortlisted for {{date}}.',
    pickStart: 'Pick a start date to run a slot check.',
  },
  dashboard: {
    kicker: 'Customer dashboard',
    title: 'Your booked project and proof ledger.',
    intro: 'Track the contractor you booked, review photo proof, leave remarks, and keep wallet releases tied to verified milestones.',
    bookedContractor: 'Booked contractor',
    assignmentPending: 'No contractor selected',
    operationsAssign: 'Book a contractor from the booking flow or contractor directory.',
    projectsTracker: 'Projects & Tracker',
    escrowWallet: 'Escrow Wallet',
    noProjectTitle: 'No project yet',
    noProjectText: 'Create a booking first. Your booked projects, tracker, partner updates, remarks, and files will appear here.',
    projectIntent: 'Project intent',
    requestedWork: 'Requested work',
    projectWindow: 'Project window',
    siteAddressOptional: 'Site address optional',
    partnerUpdates: 'Partner updates',
    partnerUpdatesText: 'Leave remarks directly on a partner update when proof needs correction or clarification.',
    noUpdates: 'No partner updates yet. Uploaded proof will appear here.',
    remarkPlaceholder: 'Leave a remark for this update...',
    sendRemark: 'Send remark to partner',
    remarkAdded: 'Remark added for the partner to resolve.',
    escalationTitle: 'Escalate to partner',
    escalationText: 'Use this when there is a delay, mismatch, missing item, or quality concern that the booked contractor should resolve.',
    escalationPlaceholder: 'Describe the issue clearly...',
    escalationButton: 'Escalate issue',
    escalationSent: 'Escalation sent to the booked contractor and saved on the project record.',
    remarksTrail: 'Remarks trail',
    noRemarks: 'No remarks yet.',
    uploadedFiles: 'Uploaded files',
    noFiles: 'No files uploaded yet.',
    walletTitle: 'Escrow wallet',
    walletIntro: 'Funds paid by the customer are recorded here and unlock only after partner proof, customer approval, or audit resolution.',
    paidByCustomer: 'Paid by customer',
    released: 'Released',
    inEscrow: 'In escrow',
    unfunded: 'Unfunded',
    fundTitle: 'Fund this project wallet',
    fundText: 'Record customer funding against this project before milestone releases. Online payment gateway capture can use this same transaction ledger.',
    paymentReference: 'Payment reference',
    recordReference: 'Record reference',
    payRazorpay: 'Pay with Razorpay',
    fundingLedger: 'Funding ledger',
    noTransactions: 'No wallet transactions recorded yet.',
    settingsTitle: 'User profile',
    settingsText: 'Manage the details Grihamm uses for project coordination.',
    saveProfile: 'Save profile',
    profileSaved: 'Profile details updated.',
    auditTitle: 'Audit & Refund',
    auditText: 'Request a physical Grihamm audit when work quality, delay, or scope mismatch needs independent review. Audit findings become part of the project record.',
    auditReason: 'What should our audit team inspect?',
    preferredSlot: 'Preferred visit slot',
    requestAudit: 'Request audit',
    auditHistory: 'Audit history',
  },
  admin: {
    kicker: 'Admin operations',
    title: 'Control quality, listings, and audits.',
    intro: 'Review marketplace supply, approve applications, inspect customer-selected bookings, verify project proof, and close audit loops from one operations console.',
    tabs: { projects: 'Projects', professionals: 'Professionals', applications: 'Applications', updates: 'Updates', audits: 'Audits', leads: 'Contact queries', users: 'Users', wallet: 'Wallet' },
    stats: { projects: 'Projects', listed: 'Listed professionals', pending: 'Applications pending', remarks: 'Open remarks', leads: 'New contact queries', users: 'Signed-in users', wallet: 'Wallet paid' },
    projectHeaders: ['Project', 'Customer', 'Intent', 'Customer-selected contractor', 'Wallet', 'Progress', 'Booking rule'],
    usersHeaders: ['User', 'Role', 'Language', 'Phone', 'Active project', 'Profile', 'Wallet paid', 'Last updated'],
    contactHeaders: ['Lead', 'Contact', 'Message', 'Language / Source', 'Submitted', 'Status', 'ID'],
    walletHeaders: ['User', 'Project', 'Amount', 'Type', 'Gateway', 'Status', 'Recorded'],
    marketplaceSupply: 'Marketplace Supply',
    addProfessional: 'Add Professional',
    applications: 'Applications',
    siteUpdates: 'Site Updates and Remarks',
    paidAudits: 'Paid Grihamm Site Audits',
    signedInUsers: 'Signed-in users',
    contactQueries: 'Contact queries',
    walletPayments: 'Wallet payments',
    chooseContractor: 'Customer-selected contractor',
    professionalAdded: 'Professional added and listed.',
    appApproved: 'Application approved and listed.',
    appRejected: 'Application rejected.',
    contractorAssigned: 'Contractor selected by customer.',
    watchTitle: 'What admin should watch',
  },
  contractorOS: {
    kicker: 'Partner profile',
    title: 'Upload progress. Resolve remarks.',
    intro: 'Partners update customer-booked work with photos, completed tasks, blockers, and next steps. Customers review those updates from their profile and leave remarks against them.',
    noProfileTitle: 'No partner profile linked',
    noProfileText: 'Your account is not linked to a listed professional profile yet. After admin approval, customer-booked jobs and upload controls will appear here.',
    assignedJobs: 'Booked jobs',
    submitUpdate: 'Submit work update',
    updateTitle: 'Update title',
    nextStep: 'Next visit / next step',
    summaryPlaceholder: 'Work completed, blockers, material status, and site condition.',
    completedPlaceholder: 'Completed tasks, one per line',
    uploadImages: 'Upload progress images',
    uploadText: 'Images up to 8 MB each. They are saved to Supabase Storage and attached to this project.',
    submitButton: 'Submit update',
    submitted: 'Progress update submitted with proof files. Customer can now review and remark.',
    customerRemarks: 'Customer remarks',
    auditStatus: 'Audit status',
    submittedUpdates: 'Submitted updates',
    uploadedProof: 'Uploaded proof files',
    noAssigned: 'No customer-booked project yet.',
    noAudit: 'No audit requested on this project.',
    noProof: 'No progress files uploaded yet.',
  },
  auth: {
    welcome: 'Welcome to Grihamm',
    text: 'Sign in to book services, track your project, and connect with certified professionals.',
    continueWith: 'Continue with',
    google: 'Sign in with Google',
    termsText: "By signing in, you agree to Grihamm's",
  },
  profileSetup: {
    title: 'Welcome to Grihamm',
    text: 'Complete your profile so we can route you to the right dashboard.',
    occupation: 'What do you do?',
    selectOccupation: 'Select occupation',
    customerOwner: 'Customer / Property Owner',
    architect: 'Architect',
    student: 'Student',
    developer: 'Real Estate Developer',
    other: 'Other',
    specify: 'Please specify...',
    phoneOptional: 'Phone number (optional)',
    invalidPhone: 'Please enter a valid phone number.',
    failed: 'Something went wrong. Please try again.',
    complete: 'Complete setup',
  },
  contactBot: {
    open: 'Open contact assistant',
    eyebrow: 'Contact Grihamm',
    prompt: 'Our team will reach you within a few hours.',
    name: 'Name',
    namePlaceholder: 'Your full name',
    phone: 'Phone',
    email: 'Email',
    city: 'City',
    cityPlaceholder: 'Bengaluru, Pune, or your city',
    message: 'What do you need help with?',
    messagePlaceholder: 'Briefly describe your project, contractor issue, booking question, or audit need.',
    send: 'Send contact request',
    sending: 'Sending...',
    success: 'Received. Grihamm operations will contact you soon.',
    errors: {
      name: 'Please add your name.',
      contact: 'Please add a phone number or email.',
      message: 'Please add a short message.',
      failed: 'Could not save this request. Please call or email Grihamm directly.',
    },
  },
  about: {
    title: "Interior projects shouldn't depend on trust alone.",
    intro: 'Grihamm is a trust-first platform for interior execution. We help customers and professionals run projects on systems, transparency, and accountability.',
    whoTitle: 'Who we are',
    whoText: 'Grihamm is a trust-first platform for interior execution, built for customers who need clarity and professionals who want to grow through documented work.',
    visionTitle: 'Vision',
    visionText: "To become India's trust infrastructure for interiors across homes, offices, retail spaces, clinics, studios, and commercial properties.",
    missionTitle: 'Mission',
    missionText: 'To build confidence for customers and growth for professionals by making scope, progress, communication, and payments clear from the first brief to handover.',
    standardsTitle: 'Operating standards',
    trustTitle: 'Trust model',
    proofText: 'Verified partners. Structured execution. Transparent tracking. Accountable payments.',
    cta: 'Book a partner',
    partnerCta: 'Apply as partner',
    pillarsEyebrow: 'What makes Grihamm different',
    pillarsTitle: 'Four pillars for reliable execution.',
    pillars: [
      {
        title: 'Verified partners',
        text: 'Identity, credentials, warranties, and reference projects are reviewed before customers choose a professional.'
      },
      {
        title: 'Structured execution',
        text: 'Every project starts with clear scope, timelines, budgets, preferences, and measurable milestones.'
      },
      {
        title: 'Transparent tracking',
        text: 'Photos, updates, approvals, files, and communication stay connected to one project record.'
      },
      {
        title: 'Accountable payments',
        text: 'Funds are linked to visible progress instead of verbal commitments or scattered follow-ups.'
      }
    ],
    standards: [
      {
        title: 'Verified partner profiles',
        text: 'Every partner profile includes service areas, expertise, pricing, business details, warranties, and reference projects.'
      },
      {
        title: 'Structured project briefs',
        text: 'Every booking captures scope, budget, timelines, preferences, and supporting files to reduce misunderstandings.'
      },
      {
        title: 'One project record',
        text: 'All updates, images, comments, approvals, and payment milestones are maintained in one transparent project timeline.'
      }
    ],
    trust: [
      {
        title: 'Milestone-based payments',
        text: 'Payments remain visible and are released against completed milestones.'
      },
      {
        title: 'Transparent communication',
        text: 'Customers can review updates and leave remarks directly within the project.'
      },
      {
        title: 'Platform oversight',
        text: 'Grihamm maintains accountability through partner reviews, project audits, and operational safeguards.'
      }
    ],
    whyTitle: 'Why Grihamm exists',
    whyText: 'Interior projects rarely fail because talent is missing. They fail when scope, updates, proof, and payments are not transparent enough for everyone to stay aligned.',
    manifesto: "Interior projects shouldn't depend on trust alone. They should run on systems, transparency, and accountability.",
    principlesEyebrow: 'Our principles',
    principlesTitle: 'The rules behind the platform.',
    principles: [
      'Transparency over assumptions.',
      'Systems over promises.',
      'Progress over opinions.',
      'Documentation over disputes.',
      'Trust through accountability.'
    ],
  },
  legal: {
    terms: {
      kicker: 'Terms of service',
      title: 'Grihamm platform terms',
      intro: 'These terms explain how customers, contractors, interior designers, and Grihamm operations should use the platform.',
    },
    privacy: {
      kicker: 'Privacy policy',
      title: 'How Grihamm handles data',
      intro: 'This policy explains the practical data Grihamm collects to run bookings, professional profiles, project tracking, remarks, and audits.',
    },
    updated: 'Last updated: 16 May 2026',
    findServices: 'Find services',
    backHome: 'Back to home',
  },
  taxonomy: {
    home: 'Home',
    corporate_office: 'Corporate office',
    commercial_property: 'Commercial property',
    retail_store: 'Retail store',
    clinic_wellness_space: 'Clinic / wellness space',
    studio_showroom: 'Studio / showroom',
    custom_home: 'Custom home',
    custom_office: 'Custom office',
    custom_commercial: 'Custom commercial',
    custom_retail: 'Custom retail',
    custom_clinic: 'Custom clinic',
    custom_studio: 'Custom studio',
    carpet_area: 'Carpet area',
    built_up_area: 'Built-up area',
    floor_area: 'Floor area',
    interior_design: 'Interior Design',
    space_planning: 'Space Planning',
    modular_kitchen: 'Modular Kitchen',
    wardrobes: 'Wardrobes',
    residential_turnkey: 'Residential Turnkey',
    office_fit_out: 'Office Fit-out',
    office_layout: 'Office layout',
    retail_interiors: 'Retail Interiors',
    commercial_renovation: 'Commercial Renovation',
    commercial_repair: 'Commercial repair',
    brand_finishes: 'Brand finishes',
    electrical: 'Electrical',
    plumbing: 'Plumbing',
    civil_work: 'Civil Work',
    false_ceiling: 'False Ceiling',
    painting: 'Painting',
    soft_furnishing: 'Soft Furnishing',
    turnkey_execution: 'Turnkey execution',
    carpentry: 'Carpentry',
    paint: 'Paint',
    tiling_prep: 'Tiling prep',
    sofa_bedback: 'Sofa / bedback',
    lighting: 'Lighting',
    repair: 'Repair',
  },
};


i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
    },
    lng: resolveLanguage(),
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    returnNull: false,
  });

document.documentElement.lang = i18n.language;

if (i18n.language !== 'en') {
  void loadMachineTranslations(i18n.language)
    .then(() => i18n.changeLanguage(i18n.language))
    .catch(error => console.warn('Machine translation unavailable; using English fallback.', error));
}

export default i18n;
