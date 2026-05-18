export const supportedCities = ['Bengaluru', 'Pune'];

export const propertyCategories = [
  {
    id: 'all',
    label: 'All property types',
    subtypes: ['Any property'],
    services: [],
  },
  {
    id: 'home',
    label: 'Home',
    subtypes: ['1 BHK', '2 BHK', '3 BHK', '4 BHK+', 'Villa', 'Penthouse', 'Farmhouse'],
    services: ['Interior Design', 'Space Planning', 'Modular Kitchen', 'Wardrobes', 'Residential Turnkey', 'Electrical', 'Plumbing', 'Civil Work', 'False Ceiling', 'Painting'],
  },
  {
    id: 'corporate',
    label: 'Corporate office',
    subtypes: ['Startup office', 'Corporate headquarters', 'Coworking floor', 'Meeting rooms', 'Reception and lobby', 'Pantry and cafeteria'],
    services: ['Office Fit-out', 'Office layout', 'Space Planning', 'BOQ', 'Electrical', 'False Ceiling', 'Painting', 'Carpentry'],
  },
  {
    id: 'commercial',
    label: 'Commercial property',
    subtypes: ['Showroom', 'Restaurant / cafe', 'Hotel / hospitality', 'Building common area', 'Warehouse office', 'Commercial renovation'],
    services: ['Commercial Renovation', 'Commercial repair', 'Civil Work', 'Plumbing', 'Tiling prep', 'False Ceiling', 'Painting', 'Turnkey execution'],
  },
  {
    id: 'retail',
    label: 'Retail store',
    subtypes: ['Fashion store', 'Grocery / mart', 'Salon / spa', 'Electronics store', 'Display showroom', 'Kiosk'],
    services: ['Retail Interiors', 'Brand finishes', 'Carpentry', 'Electrical', 'Lighting', 'Painting', 'Civil Work'],
  },
  {
    id: 'clinic',
    label: 'Clinic / wellness space',
    subtypes: ['Dental clinic', 'Doctor chamber', 'Diagnostic center', 'Wellness studio', 'Therapy room', 'Reception area'],
    services: ['Interior Design', 'Space Planning', 'Electrical', 'Plumbing', 'False Ceiling', 'Painting', 'Material selection'],
  },
  {
    id: 'studio',
    label: 'Studio / showroom',
    subtypes: ['Creative studio', 'Photography studio', 'Training studio', 'Product showroom', 'Experience center', 'Display suite'],
    services: ['Interior Design', 'Lighting', 'Brand finishes', 'Carpentry', 'False Ceiling', 'Painting', 'Office Fit-out'],
  },
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
  customerName: '',
  city: supportedCities[0],
  propertyCategory: propertyCategories[0].id,
  propertySubtype: propertyCategories[0].subtypes[0],
  areaType: areaTypes[0],
  areaSqft: 1000,
  budgetMin: 100000,
  budgetMax: 800000,
  homeType: 'Property project - General requirement',
  budget: 300000,
  scopeText: '',
};

export const auditPrice = 999;
