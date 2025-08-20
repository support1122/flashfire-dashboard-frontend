import React, { createContext, useState } from "react";

// ---- Types ----
export interface UserProfile {
  userId?: string; // MongoDB ObjectId string
  firstName: string;
  lastName: string;
  contactNumber: string;
  dob: string; // ISO date string

  // Education
  bachelorsUniDegree: string;
  bachelorsGradMonthYear: string; // ISO date string
  mastersUniDegree: string;
  mastersGradMonthYear: string; // ISO date string

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
  visaExpiry: string;

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

type UserProfileContextType = {
  userProfile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void; // replace or clear
  updateProfile: (patch: Partial<UserProfile>) => void; // shallow merge
  clearProfile: () => void;
};

// ---- Context ----
export const UserProfileContext = createContext<UserProfileContextType | null>(null);

// ---- Provider ----
export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const raw = localStorage.getItem("userProfile");
      return raw ? (JSON.parse(raw) as UserProfile) : null;
    } catch (e) {
      console.error("Failed to parse userProfile from localStorage:", e);
      return null;
    }
  });

  const persist = (profile: UserProfile | null) => {
    try {
      if (profile) {
        localStorage.setItem("userProfile", JSON.stringify(profile));
      } else {
        localStorage.removeItem("userProfile");
      }
    } catch (e) {
      console.error("Failed to persist userProfile:", e);
    }
  };

  const setProfile = (profile: UserProfile | null) => {
    setUserProfile(profile);
    persist(profile);
  };

  const updateProfile = (patch: Partial<UserProfile>) => {
    setUserProfile(prev => {
      const next = { ...(prev ?? {} as UserProfile), ...patch } as UserProfile;
      persist(next);
      return next;
    });
  };

  const clearProfile = () => setProfile(null);

  return (
    <UserProfileContext.Provider value={{ userProfile, setProfile, updateProfile, clearProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
}
