import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  type User as FirebaseUser,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { supabase } from '../lib/supabase';

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
  loginAsRole: (role: UserRole, emailOverride?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  isFirebaseConfigured: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const SUPER_ADMIN_EMAIL = 'swastik.kumar@aegis.edu.in';
const LOCAL_PROFILE_KEY = 'grihammUserProfiles';
const LOCAL_USER_KEY = 'grihammLocalUser';

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

const readProfileStore = (): Record<string, UserProfile> => {
  try {
    const rawStore = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!rawStore) return {};
    const parsedStore = JSON.parse(rawStore);
    return parsedStore && typeof parsedStore === 'object' ? parsedStore : {};
  } catch {
    return {};
  }
};

const writeProfileStore = (profiles: Record<string, UserProfile>) => {
  window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(profiles));
};

const readLocalUser = (): AuthUser | null => {
  try {
    const rawUser = window.localStorage.getItem(LOCAL_USER_KEY);
    if (!rawUser) return null;
    const parsedUser = JSON.parse(rawUser);
    return parsedUser && typeof parsedUser === 'object' ? parsedUser : null;
  } catch {
    return null;
  }
};

const writeLocalUser = (user: AuthUser) => {
  window.localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(user));
};

const toAuthUser = (user: FirebaseUser): AuthUser => ({
  uid: user.uid,
  displayName: user.displayName,
  email: user.email,
  photoURL: user.photoURL,
});

const isSuperAdminEmail = (email?: string | null) => email?.toLowerCase() === SUPER_ADMIN_EMAIL;

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

const createInitialProfile = (user: AuthUser): UserProfile => ({
  uid: user.uid,
  displayName: user.displayName,
  email: user.email,
  photoURL: user.photoURL,
  role: inferInitialRole(user),
  academyEnrolled: false,
  profileCompleted: false,
});

const roleLabel: Record<UserRole, string> = {
  homeowner: 'Customer',
  contractor: 'Partner',
  designer: 'Interior Designer',
  admin: 'Admin',
};

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

const readStoredProfile = async (uid: string): Promise<UserProfile | null> => {
  if (!supabase) {
    return readProfileStore()[uid] || null;
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('uid', uid)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? rowToProfile(data as UserProfileRow) : null;
};

const writeStoredProfile = async (profile: UserProfile) => {
  if (!supabase) {
    const profiles = readProfileStore();
    profiles[profile.uid] = profile;
    writeProfileStore(profiles);
    return;
  }

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
    if (!auth || !googleProvider) {
      await loginAsRole('homeowner');
      return;
    }

    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const loginAsRole = async (role: UserRole, emailOverride?: string) => {
    const requestedEmail = emailOverride?.trim().toLowerCase();
    const safeRole = resolveAllowedRole(role, requestedEmail);
    const localUser: AuthUser = {
      uid: requestedEmail ? `local-${requestedEmail}` : `local-${safeRole}`,
      displayName: roleLabel[safeRole],
      email: requestedEmail || `${safeRole}@local.grihamm`,
      photoURL: null,
    };

    const profile: UserProfile = {
      ...localUser,
      role: safeRole,
      academyEnrolled: false,
      profileCompleted: true,
      occupation: safeRole === 'homeowner' ? 'Customer / Property Owner' : roleLabel[safeRole],
    };

    await writeStoredProfile(profile);
    writeLocalUser(localUser);
    setCurrentUser(localUser);
    setUserProfile(profile);
  };

  const logout = async () => {
    try {
      if (auth) {
        await signOut(auth);
      }
      window.localStorage.removeItem(LOCAL_USER_KEY);
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
      role: inferInitialRole(currentUser),
      academyEnrolled: false,
      profileCompleted: false,
      ...userProfile,
      ...data,
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

    if (!auth) {
      void applyUser(readLocalUser());
      return () => {
        isActive = false;
      };
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const authUser = user ? toAuthUser(user) : null;
      void applyUser(authUser);
    });

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    currentUser,
    userProfile,
    loading,
    login,
    loginAsRole,
    logout,
    updateProfile,
    refreshProfile,
    isFirebaseConfigured: Boolean(auth),
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
