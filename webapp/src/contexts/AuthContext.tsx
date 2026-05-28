import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, hasSupabaseConfig } from '../lib/supabase';

export type UserRole = 'homeowner' | 'contractor' | 'designer' | 'admin';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
}

export interface UserProfile {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  role: UserRole;
  phoneNumber?: string;
  activeProject?: string;
  companyName?: string;
  occupation?: string;
  academyEnrolled?: boolean;
  profileCompleted?: boolean;
  isDesigner?: boolean;
  specialty?: string;
  experience?: string;
  consultationFee?: string;
  projectFee?: string;
  bio?: string;
  education?: string;
  certifications?: string;
}

interface AuthContextType {
  currentUser: AuthUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isAuthConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const configuredAdminEmails = String(import.meta.env.VITE_SUPER_ADMIN_EMAILS || 'swastik.kumar@aegis.edu.in')
  .split(',')
  .map(email => email.trim().toLowerCase())
  .filter(Boolean);

type UserProfileRow = {
  uid: string;
  display_name: string | null;
  email: string | null;
  photo_url: string | null;
  role: UserRole;
  phone_number: string | null;
  active_project: string | null;
  company_name: string | null;
  occupation: string | null;
  academy_enrolled: boolean | null;
  profile_completed: boolean | null;
  is_designer: boolean | null;
  specialty: string | null;
  experience: string | null;
  consultation_fee: string | null;
  project_fee: string | null;
  bio: string | null;
  education: string | null;
  certifications: string | null;
};

const isSuperAdminEmail = (email?: string | null) => Boolean(email && configuredAdminEmails.includes(email.toLowerCase()));

const resolveAllowedRole = (role: UserRole, email?: string | null): UserRole => {
  if (isSuperAdminEmail(email)) return 'admin';
  return role === 'admin' ? 'homeowner' : role;
};

const inferInitialRole = (user: AuthUser): UserRole => {
  return isSuperAdminEmail(user.email) ? 'admin' : 'homeowner';
};

const normalizeProfile = (profile: UserProfile, user: AuthUser): UserProfile => ({
  ...profile,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL,
  role: resolveAllowedRole(profile.role, user.email),
});

const publicProfilePatch = (data: Partial<UserProfile>): Partial<UserProfile> => {
  const safeData = { ...data };
  delete safeData.role;
  delete safeData.uid;
  delete safeData.email;
  delete safeData.displayName;
  delete safeData.photoURL;
  return safeData;
};

const createInitialProfile = (user: AuthUser): UserProfile => ({
  uid: user.uid,
  displayName: user.displayName,
  email: user.email,
  photoURL: user.photoURL,
  role: inferInitialRole(user),
  academyEnrolled: false,
  profileCompleted: false,
});

const profileToRow = (profile: UserProfile): UserProfileRow => ({
  uid: profile.uid,
  display_name: profile.displayName,
  email: profile.email,
  photo_url: profile.photoURL,
  role: profile.role,
  phone_number: profile.phoneNumber || null,
  active_project: profile.activeProject || null,
  company_name: profile.companyName || null,
  occupation: profile.occupation || null,
  academy_enrolled: profile.academyEnrolled ?? false,
  profile_completed: profile.profileCompleted ?? false,
  is_designer: profile.isDesigner ?? false,
  specialty: profile.specialty || null,
  experience: profile.experience || null,
  consultation_fee: profile.consultationFee || null,
  project_fee: profile.projectFee || null,
  bio: profile.bio || null,
  education: profile.education || null,
  certifications: profile.certifications || null,
});

const rowToProfile = (row: UserProfileRow): UserProfile => ({
  uid: row.uid,
  displayName: row.display_name,
  email: row.email,
  photoURL: row.photo_url,
  role: row.role,
  phoneNumber: row.phone_number || undefined,
  activeProject: row.active_project || undefined,
  companyName: row.company_name || undefined,
  occupation: row.occupation || undefined,
  academyEnrolled: row.academy_enrolled ?? false,
  profileCompleted: row.profile_completed ?? false,
  isDesigner: row.is_designer ?? false,
  specialty: row.specialty || undefined,
  experience: row.experience || undefined,
  consultationFee: row.consultation_fee || undefined,
  projectFee: row.project_fee || undefined,
  bio: row.bio || undefined,
  education: row.education || undefined,
  certifications: row.certifications || undefined,
});

const toAuthUser = (user: SupabaseUser): AuthUser => ({
  uid: user.id,
  displayName: user.user_metadata?.full_name || user.user_metadata?.name || null,
  email: user.email || null,
  photoURL: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
});

const readStoredProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('uid', uid)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToProfile(data as UserProfileRow) : null;
};

const writeStoredProfile = async (profile: UserProfile) => {
  if (!supabase) return;

  const { error } = await supabase
    .from('user_profiles')
    .upsert(profileToRow(profile), { onConflict: 'uid' });

  if (error) throw new Error(error.message);
};

const fetchOrCreateProfile = async (user: AuthUser): Promise<UserProfile> => {
  const storedProfile = await readStoredProfile(user.uid);
  if (storedProfile) {
    const normalizedProfile = normalizeProfile(storedProfile, user);
    await writeStoredProfile(normalizedProfile);
    return normalizedProfile;
  }

  const newProfile = createInitialProfile(user);
  await writeStoredProfile(newProfile);
  return newProfile;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const login = async () => {
    if (!supabase) {
      console.error('Supabase is not configured. Cannot sign in.');
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Google Sign-In failed:', error.message);
    }
  };

  const logout = async () => {
    try {
      if (supabase) {
        await supabase.auth.signOut();
      }
      setCurrentUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;

    const mergedProfile: UserProfile = {
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      email: currentUser.email,
      photoURL: currentUser.photoURL,
      academyEnrolled: false,
      profileCompleted: false,
      ...userProfile,
      ...publicProfilePatch(data),
      role: resolveAllowedRole(userProfile?.role || inferInitialRole(currentUser), currentUser.email),
    };
    const nextProfile = normalizeProfile(mergedProfile, currentUser);

    await writeStoredProfile(nextProfile);
    setUserProfile(nextProfile);
  };

  const refreshProfile = async () => {
    if (!currentUser) return;
    const profile = await fetchOrCreateProfile(currentUser);
    setUserProfile(profile);
  };

  useEffect(() => {
    let isActive = true;

    const applyUser = async (nextUser: AuthUser | null) => {
      setCurrentUser(nextUser);

      if (!nextUser) {
        setUserProfile(null);
        if (isActive) setLoading(false);
        return;
      }

      try {
        const profile = await fetchOrCreateProfile(nextUser);
        if (isActive) setUserProfile(profile);
      } catch (error) {
        console.error('Profile load failed:', error);
        if (isActive) setUserProfile(normalizeProfile(createInitialProfile(nextUser), nextUser));
      } finally {
        if (isActive) setLoading(false);
      }
    };

    if (!supabase) {
      queueMicrotask(() => {
        if (isActive) setLoading(false);
      });
      return () => {
        isActive = false;
      };
    }

    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        void applyUser(toAuthUser(session.user));
      } else {
        if (isActive) setLoading(false);
      }
    });

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event: string, session: Session | null) => {
        if (session?.user) {
          void applyUser(toAuthUser(session.user));
        } else {
          void applyUser(null);
        }
      }
    );

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    logout,
    updateProfile,
    refreshProfile,
    isAuthConfigured: hasSupabaseConfig,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
