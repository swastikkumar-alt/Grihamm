export const supportedCities = ['Bengaluru', 'Pune'];

export const projectTypes = [
  { label: 'Home', spaces: ['1 BHK', '2 BHK', '3 BHK', '4 BHK+', 'Villa', 'Penthouse', 'Farmhouse', 'Custom home'] },
  { label: 'Corporate office', spaces: ['Startup office', 'Corporate headquarters', 'Coworking floor', 'Meeting rooms', 'Reception and lobby', 'Pantry and cafeteria', 'Custom office'] },
  { label: 'Commercial property', spaces: ['Showroom', 'Restaurant / cafe', 'Hotel / hospitality', 'Building common area', 'Warehouse office', 'Commercial renovation', 'Custom commercial'] },
  { label: 'Retail store', spaces: ['Fashion store', 'Grocery / mart', 'Salon / spa', 'Electronics store', 'Display showroom', 'Kiosk', 'Custom retail'] },
  { label: 'Clinic / wellness space', spaces: ['Dental clinic', 'Doctor chamber', 'Diagnostic center', 'Wellness studio', 'Therapy room', 'Reception area', 'Custom clinic'] },
  { label: 'Studio / showroom', spaces: ['Creative studio', 'Photography studio', 'Training studio', 'Product showroom', 'Experience center', 'Display suite', 'Custom studio'] },
];

export const areaTypes = ['Carpet area', 'Built-up area', 'Floor area'];

export const partnerSpecializations = [
  'Interior Design',
  'Space Planning',
  'Modular Kitchen',
  'Wardrobes',
  'Residential Turnkey',
  'Office Fit-out',
  'Office layout',
  'Retail Interiors',
  'Commercial Renovation',
  'Commercial repair',
  'Brand finishes',
  'Electrical',
  'Plumbing',
  'Civil Work',
  'False Ceiling',
  'Painting',
  'Soft Furnishing',
];

export const defaultBooking = {
  siteAddress: '',
  timeline: '',
  desiredStartDate: '',
  targetHandoverDate: '',
  visitPreference: 'Site visit this week',
  projectType: '',
  city: '',
  propertySubtype: '',
  customSpace: '',
  areaType: areaTypes[0],
  areaSqft: 0,
  budgetMin: 100000,
  budgetMax: 800000,
  homeType: '',
  budget: 300000,
};

export const auditPrice = 999;
