// import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

// /** =====================
//  * Types – keep in sync with backend
//  * ===================== */
// export interface UserProfile {
//   userId?: string; // MongoDB ObjectId string
//   firstName: string;
//   lastName: string;
//   contactNumber: string;
//   dob: string; // ISO date string

//   // Education
//   bachelorsUniDegree: string;
//   bachelorsGradMonthYear: string; // ISO (YYYY-MM)
//   mastersUniDegree: string;
//   mastersGradMonthYear: string; // ISO (YYYY-MM)

//   // Immigration
//   visaStatus:
//     | "CPT"
//     | "F1"
//     | "F1 OPT"
//     | "F1 STEM OPT"
//     | "H1B"
//     | "Green Card"
//     | "U.S. Citizen"
//     | "Other";
//   visaExpiry: string; // ISO date

//   // Address
//   address: {
//     street: string;
//     city: string;
//     state: string;
//     zipCode: string;
//     country?: string;
//   };

//   // Preferences & Experience
//   preferredRoles: string[];
//   experienceLevel:
//     | "Entry level"
//     | "0-2 Years"
//     | "0-3 Years"
//     | "0-4 Years"
//     | "0-5 Years"
//     | "0-6 Years"
//     | "0-7 Years"
//     | "Other";
//   expectedSalaryRange: "60k-100k" | "100k-150k" | "150k-200k" | "Other";
//   preferredLocations: string[];
//   targetCompanies: string[];
//   reasonForLeaving: string;

//   // Links & Documents
//   linkedinUrl: string;
//   githubUrl: string;
//   portfolioUrl: string;
//   coverLetterUrl: string;
//   resumeUrl: string;

//   // Consent
//   confirmAccuracy: boolean;
//   agreeTos: boolean;

//   // Optional
//   email?: string;
//   status?: "new" | "in_review" | "complete" | "rejected";
// }

// /**
//  * Shape we expose through context
//  */
// export type UserProfileContextType = {
//   userProfile: UserProfile | null;
//   setProfile: (profile: UserProfile | null) => void;
//   updateProfile: (patch: Partial<UserProfile>) => void; // shallow merge
//   clearProfile: () => void;
//   setProfileFromApi: (apiPayload: unknown) => void; // normalize + set
// };

// /** =====================
//  * LocalStorage helpers
//  * ===================== */
// const STORAGE_KEY = "userProfile";

// function safeParse<T = any>(raw: string | null): T | null {
//   if (!raw) return null;
//   try {
//     return JSON.parse(raw) as T;
//   } catch {
//     return null;
//   }
// }

// function persist(profile: UserProfile | null) {
//   if (typeof window === "undefined") return;
//   try {
//     if (profile) localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
//     else localStorage.removeItem(STORAGE_KEY);
//   } catch (e) {
//     console.error("Failed to persist userProfile:", e);
//   }
// }

// function loadInitial(): UserProfile | null {
//   if (typeof window === "undefined") return null;
//   return safeParse<UserProfile>(localStorage.getItem(STORAGE_KEY));
// }

// /** =====================
//  * Normalizer – map backend -> UserProfile (handles strings/arrays, missing fields)
//  * Call this with whatever your backend returns; we coerce to our shape.
//  * ===================== */
// export function normalizeApiProfile(input: any): UserProfile | null {
//   if (!input || typeof input !== "object") return null;

//   // Some backends send arrays as CSV strings; coerce as needed
//   const csvToArray = (v: unknown): string[] => {
//     if (Array.isArray(v)) return v.filter(Boolean) as string[];
//     if (typeof v === "string") return v.split(",").map(s => s.trim()).filter(Boolean);
//     return [];
//   };

//   // Address could arrive as one string; try to parse common patterns
//   const normalizeAddress = (addr: any): UserProfile["address"] => {
//     if (!addr) return { street: "", city: "", state: "", zipCode: "", country: "" };
//     if (typeof addr === "string") {
//       // naive split: Street, City, State, Zip, Country
//       const parts = addr.split(",").map((s) => s.trim());
//       return {
//         street: parts[0] || "",
//         city: parts[1] || "",
//         state: parts[2] || "",
//         zipCode: parts[3] || "",
//         country: parts[4] || "",
//       };
//     }
//     return {
//       street: addr.street ?? "",
//       city: addr.city ?? "",
//       state: addr.state ?? "",
//       zipCode: addr.zipCode ?? "",
//       country: addr.country ?? "",
//     };
//   };

//   const profile: UserProfile = {
//     userId: input.userId ?? input._id ?? "",
//     firstName: input.firstName ?? "",
//     lastName: input.lastName ?? "",
//     contactNumber: input.contactNumber ?? "",
//     dob: input.dob ?? "",

//     bachelorsUniDegree: input.bachelorsUniDegree ?? "",
//     bachelorsGradMonthYear: input.bachelorsGradMonthYear ?? "",
//     mastersUniDegree: input.mastersUniDegree ?? "",
//     mastersGradMonthYear: input.mastersGradMonthYear ?? "",

//     visaStatus: input.visaStatus ?? "Other",
//     visaExpiry: input.visaExpiry ?? "",

//     address: normalizeAddress(input.address),

//     preferredRoles: csvToArray(input.preferredRoles),
//     experienceLevel: input.experienceLevel ?? "Entry level",
//     expectedSalaryRange: input.expectedSalaryRange ?? "Other",
//     preferredLocations: csvToArray(input.preferredLocations),
//     targetCompanies: csvToArray(input.targetCompanies),
//     reasonForLeaving: input.reasonForLeaving ?? "",

//     linkedinUrl: input.linkedinUrl ?? "",
//     githubUrl: input.githubUrl ?? "",
//     portfolioUrl: input.portfolioUrl ?? "",
//     coverLetterUrl: input.coverLetterUrl ?? "",
//     resumeUrl: input.resumeUrl ?? "",

//     confirmAccuracy: Boolean(input.confirmAccuracy),
//     agreeTos: Boolean(input.agreeTos),

//     email: input.email ?? "",
//     status: input.status ?? "new",
//   };

//   return profile;
// }

// /** =====================
//  * Context
//  * ===================== */
// export const UserProfileContext = createContext<UserProfileContextType | null>(null);

// export function UserProfileProvider({ children }: { children: React.ReactNode }) {
//   const [userProfile, setUserProfile] = useState<UserProfile | null>(() => loadInitial());

//   const setProfile = useCallback((profile: UserProfile | null) => {
//     setUserProfile(profile);
//     persist(profile);
//   }, []);

//   const updateProfile = useCallback((patch: Partial<UserProfile>) => {
//     setUserProfile((prev) => {
//       const next = { ...(prev ?? ({} as UserProfile)), ...patch } as UserProfile;
//       persist(next);
//       return next;
//     });
//   }, []);

//   const clearProfile = useCallback(() => setProfile(null), [setProfile]);

//   const setProfileFromApi = useCallback((apiPayload: unknown) => {
//     const normalized = normalizeApiProfile(apiPayload);
//     setProfile(normalized);
//   }, [setProfile]);

//   // Keep multiple tabs in sync
//   useEffect(() => {
//     const onStorage = (e: StorageEvent) => {
//       if (e.key === STORAGE_KEY) {
//         const next = safeParse<UserProfile>(e.newValue);
//         setUserProfile(next);
//       }
//     };
//     window.addEventListener("storage", onStorage);
//     return () => window.removeEventListener("storage", onStorage);
//   }, []);

//   const value = useMemo<UserProfileContextType>(() => ({
//     userProfile,
//     setProfile,
//     updateProfile,
//     clearProfile,
//     setProfileFromApi,
//   }), [userProfile, setProfile, updateProfile, clearProfile, setProfileFromApi]);

//   return (
//     <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
//   );
// }

// /** =====================
//  * Hook for components
//  * ===================== */
// export function useUserProfile() {
//   const ctx = useContext(UserProfileContext);
//   if (!ctx) throw new Error("useUserProfile must be used within <UserProfileProvider>");
//   return ctx;
// }

// /** =====================
//  * Example – after your fetch()
//  * ===================== */
// // const res = await fetch(`${API_BASE_URL}/setprofile`, { ... });
// // const json = await res.json();
// // useUserProfile().setProfileFromApi(json?.data ?? json);



import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/** =====================
 * Types – keep in sync with backend
 * ===================== */
export interface UserProfile {
  userId?: string; // MongoDB ObjectId string
  firstName: string;
  lastName: string;
  contactNumber: string;
  dob: string; // ISO date string

  // Education
  bachelorsUniDegree: string;
  bachelorsGradMonthYear: string; // ISO (YYYY-MM)
  mastersUniDegree: string;
  mastersGradMonthYear: string; // ISO (YYYY-MM)

  // Immigration
  visaStatus:
    | "CPT"
    | "F1"
    | "F1 OPT"
    | "F1 STEM OPT"
    | "H1B"
    | "Green Card"
    | "U.S. Citizen"
    | "Other";
  visaExpiry: string; // ISO date

  // Address
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country?: string;
  };

  // Preferences & Experience
  preferredRoles: string[];
  experienceLevel:
    | "Entry level"
    | "0-2 Years"
    | "0-3 Years"
    | "0-4 Years"
    | "0-5 Years"
    | "0-6 Years"
    | "0-7 Years"
    | "Other";
  expectedSalaryRange: "60k-100k" | "100k-150k" | "150k-200k" | "Other";
  preferredLocations: string[];
  targetCompanies: string[];
  reasonForLeaving: string;

  // Links & Documents
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  coverLetterUrl: string;
  resumeUrl: string;

  // Consent
  confirmAccuracy: boolean;
  agreeTos: boolean;

  // Optional
  email?: string;
  status?: "new" | "in_review" | "complete" | "rejected";
}

/**
 * Shape we expose through context
 */
export type UserProfileContextType = {
  userProfile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (patch: Partial<UserProfile>) => void; // shallow merge
  clearProfile: () => void;
  setProfileFromApi: (apiPayload: unknown) => void; // normalize + set
};

/** =====================
 * LocalStorage helpers (match your `userAuth` envelope)
 * ===================== */
const AUTH_KEY = "userAuth"; // { token, userDetails, userProfile }

type AuthBundle = {
  token?: string;
  userDetails?: any;
  userProfile?: UserProfile | null;
};

function safeParse<T = any>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAuth(): AuthBundle {
  if (typeof window === "undefined") return {};
  return safeParse<AuthBundle>(localStorage.getItem(AUTH_KEY)) || {};
}

function writeAuth(next: AuthBundle) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_KEY, JSON.stringify(next));
  } catch (e) {
    console.error("Failed to persist userAuth:", e);
  }
}

function persistProfile(profile: UserProfile | null) {
  const current = readAuth();
  const next: AuthBundle = { ...current };
  if (profile) next.userProfile = profile; else delete next.userProfile;
  writeAuth(next); // token & userDetails preserved untouched
}

function loadInitial(): UserProfile | null {
  const auth = readAuth();
  return auth.userProfile ?? null;
}

/** =====================
 * Normalizer – map backend -> UserProfile (handles strings/arrays, missing fields)
 * Call this with whatever your backend returns; we coerce to our shape.
 * ===================== */
export function normalizeApiProfile(input: any): UserProfile | null {
  if (!input || typeof input !== "object") return null;

  // Some backends send arrays as CSV strings; coerce as needed
  const csvToArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.filter(Boolean) as string[];
    if (typeof v === "string") return v.split(",").map(s => s.trim()).filter(Boolean);
    return [];
  };

  // Address could arrive as one string; try to parse common patterns
  const normalizeAddress = (addr: any): UserProfile["address"] => {
    if (!addr) return { street: "", city: "", state: "", zipCode: "", country: "" };
    if (typeof addr === "string") {
      // naive split: Street, City, State, Zip, Country
      const parts = addr.split(",").map((s) => s.trim());
      return {
        street: parts[0] || "",
        city: parts[1] || "",
        state: parts[2] || "",
        zipCode: parts[3] || "",
        country: parts[4] || "",
      };
    }
    return {
      street: addr.street ?? "",
      city: addr.city ?? "",
      state: addr.state ?? "",
      zipCode: addr.zipCode ?? "",
      country: addr.country ?? "",
    };
  };

  const profile: UserProfile = {
    userId: input.userId ?? input._id ?? "",
    firstName: input.firstName ?? "",
    lastName: input.lastName ?? "",
    contactNumber: input.contactNumber ?? "",
    dob: input.dob ?? "",

    bachelorsUniDegree: input.bachelorsUniDegree ?? "",
    bachelorsGradMonthYear: input.bachelorsGradMonthYear ?? "",
    mastersUniDegree: input.mastersUniDegree ?? "",
    mastersGradMonthYear: input.mastersGradMonthYear ?? "",

    visaStatus: input.visaStatus ?? "Other",
    visaExpiry: input.visaExpiry ?? "",

    address: normalizeAddress(input.address),

    preferredRoles: csvToArray(input.preferredRoles),
    experienceLevel: input.experienceLevel ?? "Entry level",
    expectedSalaryRange: input.expectedSalaryRange ?? "Other",
    preferredLocations: csvToArray(input.preferredLocations),
    targetCompanies: csvToArray(input.targetCompanies),
    reasonForLeaving: input.reasonForLeaving ?? "",

    linkedinUrl: input.linkedinUrl ?? "",
    githubUrl: input.githubUrl ?? "",
    portfolioUrl: input.portfolioUrl ?? "",
    coverLetterUrl: input.coverLetterUrl ?? "",
    resumeUrl: input.resumeUrl ?? "",

    confirmAccuracy: Boolean(input.confirmAccuracy),
    agreeTos: Boolean(input.agreeTos),

    email: input.email ?? "",
    status: input.status ?? "new",
  };

  return profile;
}

/** =====================
 * Context
 * ===================== */
export const UserProfileContext = createContext<UserProfileContextType | null>(null);

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => loadInitial());

  const setProfile = useCallback((profile: UserProfile | null) => {
    setUserProfile(profile);
    persistProfile(profile);
  }, []);

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setUserProfile((prev) => {
      const next = { ...(prev ?? ({} as UserProfile)), ...patch } as UserProfile;
      persistProfile(next);
      return next;
    });
  }, []);

  const clearProfile = useCallback(() => setProfile(null), [setProfile]);

  const setProfileFromApi = useCallback((apiPayload: unknown) => {
    const normalized = normalizeApiProfile(apiPayload);
    setProfile(normalized);
  }, [setProfile]);

  // Keep multiple tabs in sync (listen to `userAuth` only)
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === AUTH_KEY) {
        const nextAuth = safeParse<AuthBundle>(e.newValue);
        setUserProfile(nextAuth?.userProfile ?? null);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const value = useMemo<UserProfileContextType>(() => ({
    userProfile,
    setProfile,
    updateProfile,
    clearProfile,
    setProfileFromApi,
  }), [userProfile, setProfile, updateProfile, clearProfile, setProfileFromApi]);

  return (
    <UserProfileContext.Provider value={value}>{children}</UserProfileContext.Provider>
  );
}

/** =====================
 * Hook for components
 * ===================== */
export function useUserProfile() {
  const ctx = useContext(UserProfileContext);
  if (!ctx) throw new Error("useUserProfile must be used within <UserProfileProvider>");
  return ctx;
}

/** =====================
 * Example – after your fetch()
 * ===================== */
// const res = await fetch(`${API_BASE_URL}/setprofile`, { ... });
// const json = await res.json();
// const payload = json?.userProfile ?? json?.data?.userProfile ?? json?.data ?? json;
// useUserProfile().setProfileFromApi(payload);
