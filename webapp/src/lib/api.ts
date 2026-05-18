import { getSupabaseClient } from './supabase';

export type ProfessionalType = 'Interior Designer' | 'Contractor';
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type ProfessionalStatus = 'listed' | 'paused';

export interface Professional {
  id: string;
  name: string;
  type: ProfessionalType;
  city: string;
  phone: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  startingPrice: number;
  priceUnit: string;
  services: string[];
  serviceAreas: string[];
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
  customerName: string;
  city: string;
  homeType: string;
  scope: string[];
  budget: number;
  stage: string;
  progress: number;
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

export interface BootstrapData {
  professionals: Professional[];
  applications: ProfessionalApplication[];
  projects: Project[];
  siteUpdates: SiteUpdate[];
  remarks: Remark[];
  auditRequests: AuditRequest[];
  auditPrice: number;
}

export type ApplicationInput = Omit<ProfessionalApplication, 'id' | 'status' | 'createdAt'>;

export type ProfessionalInput = Pick<Professional, 'name' | 'type' | 'city' | 'phone' | 'startingPrice' | 'priceUnit' | 'services' | 'serviceAreas' | 'bio' | 'gstin' | 'grihammCertified' | 'academyCredential' | 'portfolioImages'> & {
  experienceYears: number;
  clientsServed: number;
};

export type SiteUpdateInput = Pick<SiteUpdate, 'projectId' | 'professionalId' | 'title' | 'summary' | 'completed' | 'images' | 'nextStep'>;
export type ProjectInput = Pick<Project, 'customerName' | 'city' | 'homeType' | 'scope' | 'budget'> & {
  designerId?: string | null;
  contractorId?: string | null;
};

type ProfessionalRow = {
  id: string;
  name: string;
  type: ProfessionalType;
  city: string;
  phone: string;
  rating: number | null;
  review_count: number | null;
  experience_years: number | null;
  starting_price: number | null;
  price_unit: string | null;
  services: string[] | null;
  service_areas: string[] | null;
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
  customer_name: string;
  city: string;
  home_type: string;
  scope: string[] | null;
  budget: number | null;
  stage: string | null;
  progress: number | null;
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

type SupabaseError = { message: string } | null | undefined;

const AUDIT_PRICE = 999;

const toArray = (value: string[] | null | undefined) => Array.isArray(value) ? value : [];
const nowIso = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`.toUpperCase();

const assertOk = (error: SupabaseError) => {
  if (error) throw new Error(error.message);
};

const professionalRow = (row: ProfessionalRow): Professional => ({
  id: row.id,
  name: row.name,
  type: row.type,
  city: row.city,
  phone: row.phone,
  rating: row.rating ?? 0,
  reviewCount: row.review_count ?? 0,
  experienceYears: row.experience_years ?? 0,
  startingPrice: row.starting_price ?? 0,
  priceUnit: row.price_unit || 'per project',
  services: toArray(row.services),
  serviceAreas: toArray(row.service_areas),
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
  customerName: row.customer_name,
  city: row.city,
  homeType: row.home_type,
  scope: toArray(row.scope),
  budget: row.budget ?? 0,
  stage: row.stage || 'planning',
  progress: row.progress ?? 0,
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

export const api = {
  bootstrap: async (): Promise<BootstrapData> => {
    const database = getSupabaseClient();
    const [
      professionalsResult,
      applicationsResult,
      projectsResult,
      siteUpdatesResult,
      remarksResult,
      auditRequestsResult,
    ] = await Promise.all([
      database.from('professionals').select('*'),
      database.from('applications').select('*').order('created_at', { ascending: false }),
      database.from('projects').select('*').order('created_at', { ascending: false }),
      database.from('site_updates').select('*').order('created_at', { ascending: false }),
      database.from('remarks').select('*').order('created_at', { ascending: false }),
      database.from('audit_requests').select('*').order('created_at', { ascending: false }),
    ]);

    [
      professionalsResult.error,
      applicationsResult.error,
      projectsResult.error,
      siteUpdatesResult.error,
      remarksResult.error,
      auditRequestsResult.error,
    ].forEach(assertOk);

    const professionals = ((professionalsResult.data || []) as ProfessionalRow[])
      .map(professionalRow)
      .sort((a, b) => (
        Number(b.status === 'listed') - Number(a.status === 'listed')
        || b.rating - a.rating
        || a.name.localeCompare(b.name)
      ));

    return {
      professionals,
      applications: ((applicationsResult.data || []) as ApplicationRow[]).map(applicationRow),
      projects: ((projectsResult.data || []) as ProjectRow[]).map(projectRow),
      siteUpdates: ((siteUpdatesResult.data || []) as SiteUpdateRow[]).map(updateRow),
      remarks: ((remarksResult.data || []) as RemarkRow[]).map(remarkRow),
      auditRequests: ((auditRequestsResult.data || []) as AuditRequestRow[]).map(auditRow),
      auditPrice: AUDIT_PRICE,
    };
  },

  createApplication: async (body: ApplicationInput) => {
    const database = getSupabaseClient();
    const { error } = await database.from('applications').insert({
      id: createId('APP'),
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
    return api.bootstrap();
  },

  updateApplicationStatus: async (id: string, status: ApplicationStatus) => {
    const database = getSupabaseClient();
    const { data, error } = await database
      .from('applications')
      .update({ status })
      .eq('id', id)
      .select('*')
      .maybeSingle();
    assertOk(error);
    if (!data) throw new Error('Application not found.');

    const application = data as ApplicationRow;
    if (status === 'approved') {
      const professionalId = id.replace('APP', application.type === 'Interior Designer' ? 'PRO' : 'CON');
      const { error: professionalError } = await database.from('professionals').upsert({
        id: professionalId,
        name: application.name,
        type: application.type,
        city: application.city,
        phone: application.phone,
        rating: 0,
        review_count: 0,
        experience_years: Number.parseInt(application.experience || '', 10) || 0,
        starting_price: application.starting_price ?? 0,
        price_unit: application.price_unit || 'per project',
        services: toArray(application.services),
        service_areas: toArray(application.service_areas),
        clients_served: application.clients_served ?? 0,
        gstin: application.gstin || '',
        grihamm_certified: Boolean(application.grihamm_certified),
        academy_credential: application.academy_credential || '',
        portfolio_images: toArray(application.portfolio_images),
        bio: application.summary || '',
        status: 'listed',
        created_at: nowIso(),
      }, { onConflict: 'id', ignoreDuplicates: true });
      assertOk(professionalError);
    }

    return api.bootstrap();
  },

  createProfessional: async (body: ProfessionalInput) => {
    const database = getSupabaseClient();
    const { error } = await database.from('professionals').insert({
      id: createId(body.type === 'Interior Designer' ? 'PRO' : 'CON'),
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
    return api.bootstrap();
  },

  createProject: async (body: ProjectInput) => {
    const database = getSupabaseClient();
    const { error } = await database.from('projects').insert({
      id: createId('GR'),
      customer_name: body.customerName || 'New customer',
      city: body.city || '',
      home_type: body.homeType || '',
      scope: body.scope || [],
      budget: Number(body.budget || 0),
      stage: 'Booking requested',
      progress: 5,
      designer_id: body.designerId || null,
      contractor_id: body.contractorId || null,
      escrow_amount: 0,
      next_action: 'Grihamm operations will verify scope and assign the delivery team.',
      created_at: nowIso(),
    });
    assertOk(error);
    return api.bootstrap();
  },

  updateProfessionalStatus: async (id: string, status: ProfessionalStatus) => {
    const database = getSupabaseClient();
    const { error } = await database.from('professionals').update({ status }).eq('id', id);
    assertOk(error);
    return api.bootstrap();
  },

  updateProfessionalCertification: async (id: string, grihammCertified: boolean, academyCredential: string) => {
    const database = getSupabaseClient();
    const { error } = await database
      .from('professionals')
      .update({ grihamm_certified: grihammCertified, academy_credential: academyCredential })
      .eq('id', id);
    assertOk(error);
    return api.bootstrap();
  },

  createSiteUpdate: async (body: SiteUpdateInput) => {
    const database = getSupabaseClient();
    const { error } = await database.from('site_updates').insert({
      id: createId('UPD'),
      project_id: body.projectId,
      professional_id: body.professionalId,
      title: body.title || 'Site progress update',
      summary: body.summary || '',
      completed: body.completed || [],
      images: body.images || [],
      next_step: body.nextStep || '',
      status: 'submitted',
      created_at: nowIso(),
    });
    assertOk(error);
    return api.bootstrap();
  },

  createRemark: async (body: { projectId: string; updateId?: string | null; authorType: Remark['authorType']; text: string }) => {
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
    return api.bootstrap();
  },

  createAuditRequest: async (body: { projectId: string; requestedBy: string; reason: string; preferredSlot: string }) => {
    const database = getSupabaseClient();
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

    return api.bootstrap();
  },

  updateAuditStatus: async (id: string, status: string) => {
    const database = getSupabaseClient();
    const { error } = await database.from('audit_requests').update({ status }).eq('id', id);
    assertOk(error);
    return api.bootstrap();
  },

  assignContractor: async (projectId: string, contractorId: string) => {
    const database = getSupabaseClient();
    const { error } = await database
      .from('projects')
      .update({
        contractor_id: contractorId,
        stage: 'Professional assigned',
        next_action: 'Assigned professional should submit the next site update.',
      })
      .eq('id', projectId);
    assertOk(error);
    return api.bootstrap();
  },
};

export const formatCurrency = (value: number) => `Rs ${new Intl.NumberFormat('en-IN').format(value)}`;
