import { getSupabaseClient } from './supabase';

export type ProfessionalType = 'Interior Designer' | 'Contractor';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ProfessionalStatus = 'listed' | 'paused';

export interface Professional {
  id: string;
  name: string;
  type: ProfessionalType;
  partnerUid: string | null;
  city: string;
  phone: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  startingPrice: number;
  priceUnit: string;
  services: string[];
  serviceAreas: string[];
  businessAddress: string;
  languages: string[];
  teamSize: number;
  monthlyCapacity: string;
  materialBrands: string[];
  warrantyPolicy: string;
  referenceProjects: string[];
  insuranceCoverage: string;
  clientsServed: number;
  gstin: string;
  grihammCertified: boolean;
  academyCredential: string;
  portfolioImages: string[];
  bio: string;
  status: ProfessionalStatus;
  createdAt: string;
}

export interface ProfessionalApplication {
  id: string;
  applicantUid: string | null;
  name: string;
  type: ProfessionalType;
  city: string;
  phone: string;
  experience: string;
  completedProjects: number;
  startingPrice: number;
  priceUnit: string;
  paymentTerms: string;
  services: string[];
  serviceAreas: string[];
  businessAddress: string;
  languages: string[];
  teamSize: number;
  monthlyCapacity: string;
  materialBrands: string[];
  warrantyPolicy: string;
  referenceProjects: string[];
  insuranceCoverage: string;
  clientsServed: number;
  gstin: string;
  grihammCertified: boolean;
  academyCredential: string;
  portfolioImages: string[];
  portfolio: string;
  headline: string;
  summary: string;
  status: ApplicationStatus;
  createdAt: string;
}

export interface Project {
  id: string;
  customerUid: string | null;
  customerName: string;
  city: string;
  homeType: string;
  projectType: string;
  propertySubtype: string;
  areaType: string;
  areaSqft: number;
  scope: string[];
  requestedServices: string[];
  budget: number;
  budgetMin: number;
  budgetMax: number;
  siteAddress: string;
  visitPreference: string;
  preferredLanguage: string;
  briefNotes: string;
  stage: string;
  progress: number;
  desiredStartDate: string;
  targetHandoverDate: string;
  timelineNote: string;
  designerId: string | null;
  contractorId: string | null;
  escrowAmount: number;
  nextAction: string;
  createdAt: string;
}

export interface SiteUpdate {
  id: string;
  projectId: string;
  professionalId: string;
  title: string;
  summary: string;
  completed: string[];
  images: string[];
  nextStep: string;
  status: string;
  createdAt: string;
}

export interface Remark {
  id: string;
  projectId: string;
  updateId: string | null;
  authorType: 'customer' | 'partner' | 'admin';
  text: string;
  status: string;
  createdAt: string;
}

export interface AuditRequest {
  id: string;
  projectId: string;
  requestedBy: string;
  reason: string;
  preferredSlot: string;
  price: number;
  status: string;
  createdAt: string;
}

export interface ProjectFile {
  id: string;
  projectId: string;
  updateId: string | null;
  ownerUid: string;
  bucket: string;
  filePath: string;
  signedUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  purpose: 'brief' | 'progress' | 'portfolio' | 'audit';
  createdAt: string;
}

export interface WalletTransaction {
  id: string;
  projectId: string;
  actorUid: string;
  amount: number;
  transactionType: 'fund' | 'release' | 'refund';
  status: 'recorded' | 'pending' | 'failed';
  provider: string;
  providerReference: string;
  note: string;
  createdAt: string;
}

export interface PlatformUser {
  uid: string;
  displayName: string;
  email: string;
  role: 'homeowner' | 'contractor' | 'designer' | 'admin';
  phoneNumber: string;
  activeProject: string;
  preferredLanguage: string;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactLeadInput {
  name: string;
  phone: string;
  email: string;
  city: string;
  message: string;
  source?: string;
  preferredLanguage?: string;
}

export interface ContactLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  message: string;
  source: string;
  preferredLanguage: string;
  status: 'new' | 'contacted' | 'closed';
  createdAt: string;
  updatedAt: string;
}

export interface BootstrapData {
  professionals: Professional[];
  applications: ProfessionalApplication[];
  projects: Project[];
  siteUpdates: SiteUpdate[];
  remarks: Remark[];
  auditRequests: AuditRequest[];
  projectFiles: ProjectFile[];
  walletTransactions: WalletTransaction[];
  users: PlatformUser[];
  contactLeads: ContactLead[];
  auditPrice: number;
}

export type ApplicationInput = Omit<ProfessionalApplication, 'id' | 'status' | 'createdAt' | 'applicantUid'> & {
  applicantUid?: string | null;
};

export type ProfessionalInput = Pick<Professional, 'name' | 'type' | 'city' | 'phone' | 'startingPrice' | 'priceUnit' | 'services' | 'serviceAreas' | 'businessAddress' | 'languages' | 'teamSize' | 'monthlyCapacity' | 'materialBrands' | 'warrantyPolicy' | 'referenceProjects' | 'insuranceCoverage' | 'bio' | 'gstin' | 'grihammCertified' | 'academyCredential' | 'portfolioImages'> & {
  experienceYears: number;
  clientsServed: number;
};

export type SiteUpdateInput = Pick<SiteUpdate, 'projectId' | 'professionalId' | 'title' | 'summary' | 'completed' | 'images' | 'nextStep'> & {
  actorUid?: string | null;
  files?: File[];
};
export type ProjectInput = Pick<Project, 'customerName' | 'city' | 'homeType' | 'scope' | 'budget'> & {
  customerUid?: string | null;
  designerId?: string | null;
  contractorId?: string | null;
  projectType?: string;
  propertySubtype?: string;
  areaType?: string;
  areaSqft?: number;
  budgetMin?: number;
  budgetMax?: number;
  requestedServices?: string[];
  siteAddress?: string;
  visitPreference?: string;
  preferredLanguage?: string;
  briefNotes?: string;
  desiredStartDate?: string;
  targetHandoverDate?: string;
  timelineNote?: string;
};

export interface DataScope {
  uid?: string | null;
  role?: 'homeowner' | 'contractor' | 'designer' | 'admin' | null;
}

type ProfessionalRow = {
  id: string;
  name: string;
  type: ProfessionalType;
  partner_uid?: string | null;
  city: string;
  phone: string;
  rating: number | null;
  review_count: number | null;
  experience_years: number | null;
  starting_price: number | null;
  price_unit: string | null;
  services: string[] | null;
  service_areas: string[] | null;
  business_address?: string | null;
  languages?: string[] | null;
  team_size?: number | null;
  monthly_capacity?: string | null;
  material_brands?: string[] | null;
  warranty_policy?: string | null;
  reference_projects?: string[] | null;
  insurance_coverage?: string | null;
  clients_served: number | null;
  gstin: string | null;
  grihamm_certified: boolean | null;
  academy_credential: string | null;
  portfolio_images: string[] | null;
  bio: string | null;
  status: ProfessionalStatus;
  created_at: string;
};

type ApplicationRow = {
  id: string;
  applicant_uid?: string | null;
  name: string;
  type: ProfessionalType;
  city: string;
  phone: string;
  experience: string | null;
  completed_projects: number | null;
  starting_price: number | null;
  price_unit: string | null;
  payment_terms: string | null;
  services: string[] | null;
  service_areas: string[] | null;
  business_address?: string | null;
  languages?: string[] | null;
  team_size?: number | null;
  monthly_capacity?: string | null;
  material_brands?: string[] | null;
  warranty_policy?: string | null;
  reference_projects?: string[] | null;
  insurance_coverage?: string | null;
  clients_served: number | null;
  gstin: string | null;
  grihamm_certified: boolean | null;
  academy_credential: string | null;
  portfolio_images: string[] | null;
  portfolio: string | null;
  headline: string | null;
  summary: string | null;
  status: ApplicationStatus;
  created_at: string;
};

type ProjectRow = {
  id: string;
  customer_uid?: string | null;
  customer_name: string;
  city: string;
  home_type: string;
  project_type?: string | null;
  property_subtype?: string | null;
  area_type?: string | null;
  area_sqft?: number | null;
  scope: string[] | null;
  requested_services?: string[] | null;
  budget: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  site_address?: string | null;
  visit_preference?: string | null;
  preferred_language?: string | null;
  brief_notes?: string | null;
  stage: string | null;
  progress: number | null;
  desired_start_date?: string | null;
  target_handover_date?: string | null;
  timeline_note?: string | null;
  designer_id: string | null;
  contractor_id: string | null;
  escrow_amount: number | null;
  next_action: string | null;
  created_at: string;
};

type SiteUpdateRow = {
  id: string;
  project_id: string;
  professional_id: string;
  title: string;
  summary: string | null;
  completed: string[] | null;
  images: string[] | null;
  next_step: string | null;
  status: string | null;
  created_at: string;
};

type RemarkRow = {
  id: string;
  project_id: string;
  update_id: string | null;
  author_type: Remark['authorType'];
  text: string;
  status: string | null;
  created_at: string;
};

type AuditRequestRow = {
  id: string;
  project_id: string;
  requested_by: string;
  reason: string;
  preferred_slot: string | null;
  price: number | null;
  status: string | null;
  created_at: string;
};

type ProjectFileRow = {
  id: string;
  project_id: string;
  update_id?: string | null;
  owner_uid: string;
  bucket: string;
  file_path: string;
  file_name: string;
  file_type: string;
  file_size: number;
  purpose: ProjectFile['purpose'];
  created_at: string;
};

type WalletTransactionRow = {
  id: string;
  project_id: string;
  actor_uid: string;
  amount: number | null;
  transaction_type: WalletTransaction['transactionType'];
  status: WalletTransaction['status'];
  provider: string | null;
  provider_reference: string | null;
  note: string | null;
  created_at: string;
};

type UserProfileRow = {
  uid: string;
  display_name: string | null;
  email: string | null;
  role: PlatformUser['role'] | null;
  phone_number: string | null;
  active_project: string | null;
  preferred_language?: string | null;
  profile_completed: boolean | null;
  created_at: string | null;
  updated_at: string | null;
};

type ContactLeadRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  message: string | null;
  source: string | null;
  preferred_language: string | null;
  status: ContactLead['status'] | null;
  created_at: string | null;
  updated_at: string | null;
};

type SupabaseError = { message: string } | null | undefined;

const AUDIT_PRICE = 999;

const toArray = (value: string[] | null | undefined) => Array.isArray(value) ? value : [];
const nowIso = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();
const parseExperienceYears = (value: string | null | undefined) => {
  const numbers = (value || '').match(/\d+/g)?.map(Number) || [];
  if (numbers.length === 0) return 0;
  return Math.max(...numbers);
};

const assertOk = (error: SupabaseError) => {
  if (error) throw new Error(error.message);
};

const professionalRow = (row: ProfessionalRow): Professional => ({
  id: row.id,
  name: row.name,
  type: row.type,
  partnerUid: row.partner_uid || null,
  city: row.city,
  phone: row.phone,
  rating: row.rating ?? 0,
  reviewCount: row.review_count ?? 0,
  experienceYears: row.experience_years ?? 0,
  startingPrice: row.starting_price ?? 0,
  priceUnit: row.price_unit || 'per project',
  services: toArray(row.services),
  serviceAreas: toArray(row.service_areas),
  businessAddress: row.business_address || '',
  languages: toArray(row.languages),
  teamSize: row.team_size ?? 0,
  monthlyCapacity: row.monthly_capacity || '',
  materialBrands: toArray(row.material_brands),
  warrantyPolicy: row.warranty_policy || '',
  referenceProjects: toArray(row.reference_projects),
  insuranceCoverage: row.insurance_coverage || '',
  clientsServed: row.clients_served ?? 0,
  gstin: row.gstin || '',
  grihammCertified: Boolean(row.grihamm_certified),
  academyCredential: row.academy_credential || '',
  portfolioImages: toArray(row.portfolio_images),
  bio: row.bio || '',
  status: row.status,
  createdAt: row.created_at,
});

const applicationRow = (row: ApplicationRow): ProfessionalApplication => ({
  id: row.id,
  applicantUid: row.applicant_uid || null,
  name: row.name,
  type: row.type,
  city: row.city,
  phone: row.phone,
  experience: row.experience || '',
  completedProjects: row.completed_projects ?? 0,
  startingPrice: row.starting_price ?? 0,
  priceUnit: row.price_unit || 'per project',
  paymentTerms: row.payment_terms || '',
  services: toArray(row.services),
  serviceAreas: toArray(row.service_areas),
  businessAddress: row.business_address || '',
  languages: toArray(row.languages),
  teamSize: row.team_size ?? 0,
  monthlyCapacity: row.monthly_capacity || '',
  materialBrands: toArray(row.material_brands),
  warrantyPolicy: row.warranty_policy || '',
  referenceProjects: toArray(row.reference_projects),
  insuranceCoverage: row.insurance_coverage || '',
  clientsServed: row.clients_served ?? 0,
  gstin: row.gstin || '',
  grihammCertified: Boolean(row.grihamm_certified),
  academyCredential: row.academy_credential || '',
  portfolioImages: toArray(row.portfolio_images),
  portfolio: row.portfolio || '',
  headline: row.headline || '',
  summary: row.summary || '',
  status: row.status,
  createdAt: row.created_at,
});

const projectRow = (row: ProjectRow): Project => ({
  id: row.id,
  customerUid: row.customer_uid || null,
  customerName: row.customer_name,
  city: row.city,
  homeType: row.home_type,
  projectType: row.project_type || row.home_type.split(' - ')[0] || '',
  propertySubtype: row.property_subtype || row.home_type.split(' - ').slice(1).join(' - ') || '',
  areaType: row.area_type || '',
  areaSqft: row.area_sqft ?? 0,
  scope: toArray(row.scope),
  requestedServices: toArray(row.requested_services),
  budget: row.budget ?? 0,
  budgetMin: row.budget_min ?? 0,
  budgetMax: row.budget_max ?? row.budget ?? 0,
  siteAddress: row.site_address || '',
  visitPreference: row.visit_preference || '',
  preferredLanguage: row.preferred_language || 'en',
  briefNotes: row.brief_notes || '',
  stage: row.stage || 'planning',
  progress: row.progress ?? 0,
  desiredStartDate: row.desired_start_date || '',
  targetHandoverDate: row.target_handover_date || '',
  timelineNote: row.timeline_note || '',
  designerId: row.designer_id,
  contractorId: row.contractor_id,
  escrowAmount: row.escrow_amount ?? 0,
  nextAction: row.next_action || '',
  createdAt: row.created_at,
});

const updateRow = (row: SiteUpdateRow): SiteUpdate => ({
  id: row.id,
  projectId: row.project_id,
  professionalId: row.professional_id,
  title: row.title,
  summary: row.summary || '',
  completed: toArray(row.completed),
  images: toArray(row.images),
  nextStep: row.next_step || '',
  status: row.status || 'submitted',
  createdAt: row.created_at,
});

const remarkRow = (row: RemarkRow): Remark => ({
  id: row.id,
  projectId: row.project_id,
  updateId: row.update_id,
  authorType: row.author_type,
  text: row.text,
  status: row.status || 'open',
  createdAt: row.created_at,
});

const auditRow = (row: AuditRequestRow): AuditRequest => ({
  id: row.id,
  projectId: row.project_id,
  requestedBy: row.requested_by,
  reason: row.reason,
  preferredSlot: row.preferred_slot || '',
  price: row.price ?? AUDIT_PRICE,
  status: row.status || 'requested',
  createdAt: row.created_at,
});

const projectFileRow = (row: ProjectFileRow): ProjectFile => ({
  id: row.id,
  projectId: row.project_id,
  updateId: row.update_id || null,
  ownerUid: row.owner_uid,
  bucket: row.bucket,
  filePath: row.file_path,
  signedUrl: '',
  fileName: row.file_name,
  fileType: row.file_type,
  fileSize: row.file_size,
  purpose: row.purpose,
  createdAt: row.created_at,
});

const isRemoteUrl = (value: string) => /^https?:\/\//i.test(value);

const signProjectFile = async (database: ReturnType<typeof getSupabaseClient>, file: ProjectFile): Promise<ProjectFile> => {
  const signed = await database.storage.from(file.bucket).createSignedUrl(file.filePath, 60 * 60);
  return {
    ...file,
    signedUrl: signed.data?.signedUrl || '',
  };
};

const signSiteUpdateImages = async (database: ReturnType<typeof getSupabaseClient>, updates: SiteUpdate[]): Promise<SiteUpdate[]> => {
  const signedUpdates = await Promise.all(updates.map(async update => {
    const images = await Promise.all(update.images.map(async image => {
      if (!image || isRemoteUrl(image)) return image;
      const signed = await database.storage.from('project-files').createSignedUrl(image, 60 * 60);
      return signed.data?.signedUrl || image;
    }));
    return { ...update, images };
  }));
  return signedUpdates;
};

const uploadProofFile = async (body: { projectId: string; ownerUid: string; purpose: ProjectFile['purpose']; file: File; updateId?: string | null }) => {
  const database = getSupabaseClient();
  const safeName = body.file.name.replace(/[^\w.-]+/g, '-').toLowerCase();
  const updateSegment = body.updateId ? `${body.updateId}/` : '';
  const filePath = `${body.ownerUid}/${body.projectId}/${body.purpose}/${updateSegment}${Date.now()}-${safeName}`;
  const bucket = 'project-files';

  const uploadResult = await database.storage.from(bucket).upload(filePath, body.file, {
    cacheControl: '3600',
    upsert: false,
  });
  assertOk(uploadResult.error);

  const filePayload = {
    id: createId('FIL'),
    project_id: body.projectId,
    update_id: body.updateId || null,
    owner_uid: body.ownerUid,
    bucket,
    file_path: filePath,
    file_name: body.file.name,
    file_type: body.file.type || 'application/octet-stream',
    file_size: body.file.size,
    purpose: body.purpose,
    created_at: nowIso(),
  };
  const { error } = await database.from('project_files').insert(filePayload);
  if (error && /update_id|schema cache/i.test(error.message)) {
    const legacyPayload = { ...filePayload };
    delete (legacyPayload as Partial<typeof filePayload>).update_id;
    const retry = await database.from('project_files').insert(legacyPayload);
    assertOk(retry.error);
  } else {
    assertOk(error);
  }

  return filePath;
};

const walletTransactionRow = (row: WalletTransactionRow): WalletTransaction => ({
  id: row.id,
  projectId: row.project_id,
  actorUid: row.actor_uid,
  amount: row.amount ?? 0,
  transactionType: row.transaction_type || 'fund',
  status: row.status || 'recorded',
  provider: row.provider || 'manual',
  providerReference: row.provider_reference || '',
  note: row.note || '',
  createdAt: row.created_at,
});

const userProfileRow = (row: UserProfileRow): PlatformUser => ({
  uid: row.uid,
  displayName: row.display_name || row.email?.split('@')[0] || 'Unnamed user',
  email: row.email || '',
  role: row.role || 'homeowner',
  phoneNumber: row.phone_number || '',
  activeProject: row.active_project || '',
  preferredLanguage: row.preferred_language || 'en',
  profileCompleted: Boolean(row.profile_completed),
  createdAt: row.created_at || '',
  updatedAt: row.updated_at || row.created_at || '',
});

const contactLeadRow = (row: ContactLeadRow): ContactLead => ({
  id: row.id,
  name: row.name || 'Unnamed lead',
  phone: row.phone || '',
  email: row.email || '',
  city: row.city || '',
  message: row.message || '',
  source: row.source || 'contact_bot',
  preferredLanguage: row.preferred_language || 'en',
  status: row.status || 'new',
  createdAt: row.created_at || '',
  updatedAt: row.updated_at || row.created_at || '',
});

export const api = {
  bootstrap: async (scope: DataScope = {}): Promise<BootstrapData> => {
    const database = getSupabaseClient();
    const isAdmin = scope.role === 'admin';
    const hasPrivilegedScope = Boolean(scope.uid) || isAdmin;

    const professionalsResult = await database.from('professionals').select('*').order('rating', { ascending: false });
    assertOk(professionalsResult.error);

    if (!hasPrivilegedScope) {
      const professionals = ((professionalsResult.data || []) as ProfessionalRow[])
        .map(professionalRow)
        .filter(item => item.status === 'listed')
        .sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));

      return {
        professionals,
        applications: [],
        projects: [],
        siteUpdates: [],
        remarks: [],
        auditRequests: [],
        projectFiles: [],
        walletTransactions: [],
        users: [],
        contactLeads: [],
        auditPrice: AUDIT_PRICE,
      };
    }

    const [
      applicationsResult,
      projectsResult,
      siteUpdatesResult,
      remarksResult,
      auditRequestsResult,
      projectFilesResult,
      walletTransactionsResult,
      userProfilesResult,
      contactLeadsResult,
    ] = await Promise.all([
      isAdmin
        ? database.from('applications').select('*').order('created_at', { ascending: false })
        : database.from('applications').select('*').eq('applicant_uid', scope.uid).order('created_at', { ascending: false }),
      database.from('projects').select('*').order('created_at', { ascending: false }),
      database.from('site_updates').select('*').order('created_at', { ascending: false }),
      database.from('remarks').select('*').order('created_at', { ascending: false }),
      database.from('audit_requests').select('*').order('created_at', { ascending: false }),
      database.from('project_files').select('*').order('created_at', { ascending: false }),
      database.from('wallet_transactions').select('*').order('created_at', { ascending: false }),
      isAdmin
        ? database.from('user_profiles').select('*').order('updated_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      isAdmin
        ? database.from('contact_leads').select('*').order('created_at', { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    const walletTableMissing = walletTransactionsResult.error
      && /wallet_transactions|schema cache|does not exist|could not find/i.test(walletTransactionsResult.error.message);
    const contactLeadsTableMissing = contactLeadsResult.error
      && /contact_leads|schema cache|does not exist|could not find/i.test(contactLeadsResult.error.message);
    [applicationsResult.error, projectsResult.error, siteUpdatesResult.error, remarksResult.error, auditRequestsResult.error, projectFilesResult.error, userProfilesResult.error].forEach(assertOk);
    if (!walletTableMissing) assertOk(walletTransactionsResult.error);
    if (!contactLeadsTableMissing) assertOk(contactLeadsResult.error);

    const professionals = ((professionalsResult.data || []) as ProfessionalRow[])
      .map(professionalRow)
      .filter(item => isAdmin || item.status === 'listed')
      .sort((a, b) => (
        Number(b.status === 'listed') - Number(a.status === 'listed')
        || b.rating - a.rating
        || a.name.localeCompare(b.name)
      ));

    const siteUpdates = await signSiteUpdateImages(
      database,
      ((siteUpdatesResult.data || []) as SiteUpdateRow[]).map(updateRow),
    );
    const projectFiles = await Promise.all(
      ((projectFilesResult.data || []) as ProjectFileRow[])
        .map(projectFileRow)
        .map(file => signProjectFile(database, file)),
    );

    return {
      professionals,
      applications: ((applicationsResult.data || []) as ApplicationRow[]).map(applicationRow),
      projects: ((projectsResult.data || []) as ProjectRow[]).map(projectRow),
      siteUpdates,
      remarks: ((remarksResult.data || []) as RemarkRow[]).map(remarkRow),
      auditRequests: ((auditRequestsResult.data || []) as AuditRequestRow[]).map(auditRow),
      projectFiles,
      walletTransactions: walletTableMissing ? [] : ((walletTransactionsResult.data || []) as WalletTransactionRow[]).map(walletTransactionRow),
      users: isAdmin ? ((userProfilesResult.data || []) as UserProfileRow[]).map(userProfileRow) : [],
      contactLeads: contactLeadsTableMissing ? [] : ((contactLeadsResult.data || []) as ContactLeadRow[]).map(contactLeadRow),
      auditPrice: AUDIT_PRICE,
    };
  },

  createApplication: async (body: ApplicationInput) => {
    const database = getSupabaseClient();
    const { error } = await database.from('applications').insert({
      id: createId('APP'),
      applicant_uid: body.applicantUid || null,
      name: body.name || '',
      type: body.type || 'Contractor',
      city: body.city || '',
      phone: body.phone || '',
      experience: body.experience || '',
      completed_projects: Number(body.completedProjects || 0),
      starting_price: Number(body.startingPrice || 0),
      price_unit: body.priceUnit || 'per project',
      payment_terms: body.paymentTerms || '',
      services: body.services || [],
      service_areas: body.serviceAreas || [],
      business_address: body.businessAddress || '',
      languages: body.languages || [],
      team_size: Number(body.teamSize || 0),
      monthly_capacity: body.monthlyCapacity || '',
      material_brands: body.materialBrands || [],
      warranty_policy: body.warrantyPolicy || '',
      reference_projects: body.referenceProjects || [],
      insurance_coverage: body.insuranceCoverage || '',
      clients_served: Number(body.clientsServed || 0),
      gstin: body.gstin || '',
      grihamm_certified: Boolean(body.grihammCertified),
      academy_credential: body.academyCredential || '',
      portfolio_images: body.portfolioImages || [],
      portfolio: body.portfolio || '',
      headline: body.headline || '',
      summary: body.summary || '',
      status: 'pending',
      created_at: nowIso(),
    });
    assertOk(error);
    return api.bootstrap({ uid: body.applicantUid });
  },

  updateApplicationStatus: async (id: string, status: ApplicationStatus) => {
    const database = getSupabaseClient();
    const current = await database
      .from('applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    assertOk(current.error);
    if (!current.data) throw new Error('Application not found.');

    const application = current.data as ApplicationRow;
    if (status === 'approved') {
      const professionalId = id.replace(/^APP/i, application.type === 'Interior Designer' ? 'PRO' : 'CON');
      const professionalPayload = {
        id: professionalId,
        partner_uid: application.applicant_uid || null,
        name: application.name,
        type: application.type,
        city: application.city,
        phone: application.phone,
        rating: 0,
        review_count: 0,
        experience_years: parseExperienceYears(application.experience),
        starting_price: application.starting_price ?? 0,
        price_unit: application.price_unit || 'per project',
        services: toArray(application.services),
        service_areas: toArray(application.service_areas),
        business_address: application.business_address || '',
        languages: toArray(application.languages),
        team_size: application.team_size ?? 0,
        monthly_capacity: application.monthly_capacity || '',
        material_brands: toArray(application.material_brands),
        warranty_policy: application.warranty_policy || '',
        reference_projects: toArray(application.reference_projects),
        insurance_coverage: application.insurance_coverage || '',
        clients_served: application.clients_served ?? 0,
        gstin: application.gstin || '',
        grihamm_certified: Boolean(application.grihamm_certified),
        academy_credential: application.academy_credential || '',
        portfolio_images: toArray(application.portfolio_images),
        bio: application.summary || application.headline || '',
        status: 'listed',
        created_at: nowIso(),
      };
      const { error: professionalError } = await database
        .from('professionals')
        .upsert(professionalPayload, { onConflict: 'id' });
      assertOk(professionalError);
    }

    const { error } = await database
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    assertOk(error);

    return api.bootstrap({ role: 'admin' });
  },

  createProfessional: async (body: ProfessionalInput) => {
    const database = getSupabaseClient();
    const { error } = await database.from('professionals').insert({
      id: createId(body.type === 'Interior Designer' ? 'PRO' : 'CON'),
      partner_uid: null,
      name: body.name || '',
      type: body.type || 'Contractor',
      city: body.city || '',
      phone: body.phone || '',
      rating: 0,
      review_count: 0,
      experience_years: Number(body.experienceYears || 0),
      starting_price: Number(body.startingPrice || 0),
      price_unit: body.priceUnit || 'per project',
      services: body.services || [],
      service_areas: body.serviceAreas || [],
      business_address: body.businessAddress || '',
      languages: body.languages || [],
      team_size: Number(body.teamSize || 0),
      monthly_capacity: body.monthlyCapacity || '',
      material_brands: body.materialBrands || [],
      warranty_policy: body.warrantyPolicy || '',
      reference_projects: body.referenceProjects || [],
      insurance_coverage: body.insuranceCoverage || '',
      clients_served: Number(body.clientsServed || 0),
      gstin: body.gstin || '',
      grihamm_certified: Boolean(body.grihammCertified),
      academy_credential: body.academyCredential || '',
      portfolio_images: body.portfolioImages || [],
      bio: body.bio || '',
      status: 'listed',
      created_at: nowIso(),
    });
    assertOk(error);
    return api.bootstrap({ role: 'admin' });
  },

  createProject: async (body: ProjectInput) => {
    const database = getSupabaseClient();
    if (!body.contractorId) {
      throw new Error('Choose a contractor before creating a booking.');
    }

    const contractorResult = await database
      .from('professionals')
      .select('id,type,status')
      .eq('id', body.contractorId)
      .maybeSingle();
    assertOk(contractorResult.error);
    const selectedContractor = contractorResult.data as Pick<ProfessionalRow, 'id' | 'type' | 'status'> | null;
    if (!selectedContractor || selectedContractor.type !== 'Contractor' || selectedContractor.status !== 'listed') {
      throw new Error('Customers can only book listed contractors.');
    }

    const legacyPayload = {
      id: createId('GR'),
      customer_uid: body.customerUid || null,
      customer_name: body.customerName || 'New customer',
      city: body.city || '',
      home_type: body.homeType || '',
      scope: body.scope || [],
      budget: Number(body.budget || 0),
      stage: 'Booking requested',
      progress: 5,
      designer_id: null,
      contractor_id: body.contractorId,
      escrow_amount: 0,
      next_action: 'Grihamm operations will verify the customer-selected contractor booking and project brief.',
      created_at: nowIso(),
    };
    const structuredPayload = {
      ...legacyPayload,
      project_type: body.projectType || '',
      property_subtype: body.propertySubtype || '',
      area_type: body.areaType || '',
      area_sqft: Number(body.areaSqft || 0),
      requested_services: body.requestedServices || [],
      budget_min: Number(body.budgetMin || 0),
      budget_max: Number(body.budgetMax || body.budget || 0),
      site_address: body.siteAddress || '',
      visit_preference: body.visitPreference || '',
      preferred_language: body.preferredLanguage || 'en',
      brief_notes: body.briefNotes || '',
      desired_start_date: body.desiredStartDate || null,
      target_handover_date: body.targetHandoverDate || null,
      timeline_note: body.timelineNote || '',
    };
    const { error } = await database.from('projects').insert(structuredPayload);
    if (error && /desired_start_date|target_handover_date|timeline_note|project_type|property_subtype|requested_services|schema cache/i.test(error.message)) {
      const retry = await database.from('projects').insert(legacyPayload);
      assertOk(retry.error);
    } else {
      assertOk(error);
    }
    if (body.customerUid) {
      const profileResult = await database
        .from('user_profiles')
        .update({ active_project: legacyPayload.id })
        .eq('uid', body.customerUid);
      assertOk(profileResult.error);
    }
    return api.bootstrap({ uid: body.customerUid, role: 'homeowner' });
  },

  updateProfessionalStatus: async (id: string, status: ProfessionalStatus) => {
    const database = getSupabaseClient();
    const { error } = await database.from('professionals').update({ status }).eq('id', id);
    assertOk(error);
    return api.bootstrap({ role: 'admin' });
  },

  updateProfessionalCertification: async (id: string, grihammCertified: boolean, academyCredential: string) => {
    const database = getSupabaseClient();
    const { error } = await database
      .from('professionals')
      .update({ grihamm_certified: grihammCertified, academy_credential: academyCredential })
      .eq('id', id);
    assertOk(error);
    return api.bootstrap({ role: 'admin' });
  },

  createSiteUpdate: async (body: SiteUpdateInput) => {
    const database = getSupabaseClient();
    const updateId = createId('UPD');
    const uploadedImages = body.actorUid && body.files?.length
      ? await Promise.all(body.files.map(file => uploadProofFile({
        projectId: body.projectId,
        ownerUid: body.actorUid as string,
        purpose: 'progress',
        file,
        updateId,
      })))
      : [];
    const { error } = await database.from('site_updates').insert({
      id: updateId,
      project_id: body.projectId,
      professional_id: body.professionalId,
      title: body.title || 'Site progress update',
      summary: body.summary || '',
      completed: body.completed || [],
      images: [...(body.images || []), ...uploadedImages],
      next_step: body.nextStep || '',
      status: 'submitted',
      created_at: nowIso(),
    });
    assertOk(error);
    return api.bootstrap({ uid: body.actorUid });
  },

  createRemark: async (body: { projectId: string; updateId?: string | null; authorType: Remark['authorType']; text: string; actorUid?: string | null }) => {
    const database = getSupabaseClient();
    const { error } = await database.from('remarks').insert({
      id: createId('REM'),
      project_id: body.projectId,
      update_id: body.updateId || null,
      author_type: body.authorType || 'customer',
      text: body.text || '',
      status: 'open',
      created_at: nowIso(),
    });
    assertOk(error);
    return api.bootstrap({ uid: body.actorUid });
  },

  createAuditRequest: async (body: { projectId: string; requestedBy: string; reason: string; preferredSlot: string; actorUid?: string | null }) => {
    const database = getSupabaseClient();
    const rpcResult = await database.rpc('request_project_audit', {
      p_project_id: body.projectId,
      p_requested_by: body.requestedBy || 'customer',
      p_reason: body.reason || '',
      p_preferred_slot: body.preferredSlot || '',
      p_price: AUDIT_PRICE,
    });
    if (!rpcResult.error) {
      return api.bootstrap({ uid: body.actorUid, role: 'homeowner' });
    }
    if (!/request_project_audit|schema cache|does not exist|could not find/i.test(rpcResult.error.message)) {
      assertOk(rpcResult.error);
    }

    const { error } = await database.from('audit_requests').insert({
      id: createId('AUD'),
      project_id: body.projectId,
      requested_by: body.requestedBy || 'customer',
      reason: body.reason || '',
      preferred_slot: body.preferredSlot || '',
      price: AUDIT_PRICE,
      status: 'requested',
      created_at: nowIso(),
    });
    assertOk(error);

    const { error: projectError } = await database
      .from('projects')
      .update({
        stage: 'Audit requested',
        next_action: `Grihamm audit team to visit site. Audit fee: Rs ${AUDIT_PRICE}.`,
      })
      .eq('id', body.projectId);
    assertOk(projectError);

    return api.bootstrap({ uid: body.actorUid, role: 'homeowner' });
  },

  fundProjectWallet: async (body: { projectId: string; actorUid?: string | null; amount: number; provider?: string; providerReference?: string; note?: string }) => {
    const database = getSupabaseClient();
    const amount = Math.round(Number(body.amount || 0));
    if (!body.projectId) throw new Error('Project is required to fund the wallet.');
    if (!amount || amount <= 0) throw new Error('Enter a valid funding amount.');

    const rpcResult = await database.rpc('record_wallet_funding', {
      p_project_id: body.projectId,
      p_amount: amount,
      p_provider: body.provider || 'manual',
      p_provider_reference: body.providerReference || '',
      p_note: body.note || '',
    });
    if (!rpcResult.error) {
      return api.bootstrap({ uid: body.actorUid, role: 'homeowner' });
    }
    if (!/record_wallet_funding|schema cache|does not exist|could not find/i.test(rpcResult.error.message)) {
      assertOk(rpcResult.error);
    }

    const currentProject = await database
      .from('projects')
      .select('escrow_amount')
      .eq('id', body.projectId)
      .maybeSingle();
    assertOk(currentProject.error);
    const currentEscrow = Number((currentProject.data as Pick<ProjectRow, 'escrow_amount'> | null)?.escrow_amount || 0);
    const transactionResult = await database.from('wallet_transactions').insert({
      id: createId('WAL'),
      project_id: body.projectId,
      actor_uid: body.actorUid,
      amount,
      transaction_type: 'fund',
      status: 'recorded',
      provider: body.provider || 'manual',
      provider_reference: body.providerReference || '',
      note: body.note || '',
      created_at: nowIso(),
    });
    assertOk(transactionResult.error);
    const projectResult = await database
      .from('projects')
      .update({
        escrow_amount: currentEscrow + amount,
        stage: 'Escrow funded',
        next_action: 'Wallet funding recorded. Grihamm operations will verify the payment reference before release.',
      })
      .eq('id', body.projectId);
    assertOk(projectResult.error);

    return api.bootstrap({ uid: body.actorUid, role: 'homeowner' });
  },

  updateAuditStatus: async (id: string, status: string) => {
    const database = getSupabaseClient();
    const { error } = await database.from('audit_requests').update({ status }).eq('id', id);
    assertOk(error);
    return api.bootstrap({ role: 'admin' });
  },

  uploadProjectFile: async (body: { projectId: string; ownerUid: string; purpose: ProjectFile['purpose']; file: File }) => {
    await uploadProofFile(body);
    return api.bootstrap({ uid: body.ownerUid });
  },

  createContactLead: async (body: ContactLeadInput) => {
    const database = getSupabaseClient();
    const { error } = await database.from('contact_leads').insert({
      id: createId('LEAD'),
      name: body.name.trim(),
      phone: body.phone.trim(),
      email: body.email.trim(),
      city: body.city.trim(),
      message: body.message.trim(),
      source: body.source || 'contact_bot',
      preferred_language: body.preferredLanguage || 'en',
      status: 'new',
      created_at: nowIso(),
    });
    assertOk(error);
  },

  updateContactLeadStatus: async (id: string, status: ContactLead['status']) => {
    const database = getSupabaseClient();
    const { error } = await database
      .from('contact_leads')
      .update({ status })
      .eq('id', id);
    assertOk(error);
    return api.bootstrap({ role: 'admin' });
  },
};

export const formatCurrency = (value: number) => `Rs ${new Intl.NumberFormat('en-IN').format(value)}`;
