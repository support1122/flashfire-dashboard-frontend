import React, { useContext, useMemo, useState, useEffect } from "react";
import { UserContext } from "../state_management/UserContext";
import { CarTaxiFront, X, Check } from "lucide-react";
import { useUserProfile } from "../state_management/ProfileContext";

/** ---------- STEPS ---------- */
const STEPS = [
  { key: "personal", title: "Personal & Education", blurb: "Tell us who you are and where you studied." },
  { key: "preferences", title: "Preferences & Experience", blurb: "Share your target roles, salary, and locations." },
  { key: "links", title: "Links, Documents & Consent", blurb: "Add URLs, upload documents, and confirm consent." },
] as const;

type ModalSection =
  | "personal"
  | "education"
  | "professional"
  | "preferences"
  | "links"
  | "terms";

const sectionToStep: Record<ModalSection, number> = {
  personal: 0,      // Personal & Education page
  education: 0,     // (same step as personal)
  professional: 1,  // Preferences & Experience page
  preferences: 1,
  links: 2,         // Links, Documents & Consent page
  terms: 2,
};


type FormData = {
  firstName: string;
  lastName: string;
  contactNumber: string;
  dob: string;
  bachelorsUniDegree: string;
  bachelorsGradMonthYear: string;
  bachelorsGPA: string;
  mastersUniDegree: string;
  mastersGradMonthYear: string;
  mastersGPA: string;
  visaStatus: string;
  visaExpiry: string;
  address: string;
  preferredRoles: string;
  experienceLevel: string;
  expectedSalaryRange: string;
  preferredLocations: string;
  targetCompanies: string;
  reasonForLeaving: string;
  linkedinUrl: string;
  githubUrl: string;
  portfolioUrl: string;
  // Files (for UI only)
  coverLetterFile?: File | null;
  resumeFile?: File | null;
  transcriptFile?: File | null;
  // Cloudinary URLs (THIS is what we persist/send)
  coverLetterUrl?: string;
  resumeUrl?: string;
  transcriptUrl?: string;
  confirmAccuracy: boolean;
  agreeTos: boolean;
   expectedSalaryNarrative: string; // free text
  ssnNumber: string;               // digits only (we'll keep 0–9)
  availabilityNote: string;
  joinTime: string;                // join time selection
};

const initialData: FormData = {
  firstName: "",
  lastName: "",
  contactNumber: "",
  dob: "",
  bachelorsUniDegree: "",
  bachelorsGradMonthYear: "",
  bachelorsGPA: "",
  mastersUniDegree: "",
  mastersGradMonthYear: "",
  mastersGPA: "",
  visaStatus: "",
  visaExpiry: "",
  address: "",
  preferredRoles: "",
  experienceLevel: "",
  expectedSalaryRange: "",
  preferredLocations: "",
  targetCompanies: "",
  reasonForLeaving: "",
  linkedinUrl: "",
  githubUrl: "",
  portfolioUrl: "",
  coverLetterFile: null,
  resumeFile: null,
  transcriptFile: null,
  coverLetterUrl: "",
  resumeUrl: "",
  transcriptUrl: "",
  confirmAccuracy: false,
  agreeTos: false,
   expectedSalaryNarrative: '', // free text
  ssnNumber: '',               // digits only (we'll keep 0–9)
  availabilityNote: '',
  joinTime: 'in 1 week',       // join time selection
};

const VISA_OPTIONS = ["CPT", "F1", "F1 OPT", "F1 STEM OPT", "H1B", "Green Card", "U.S. Citizen", "Other"];
const EXPERIENCE_OPTIONS = ["0-2 Years", "2-4 Years", "4-6 Years", "6-8 Years", "8+ Years"];
const SALARY_OPTIONS = ["60k-100k", "100k-150k", "150k-200k", "Other"];
const JOIN_TIME_OPTIONS = ["in 1 week", "in 2 week", "in 3 week", "in 4 week", "in 6-7 week"];

/** ---------- UI Helpers ---------- */
function Header({ stepIndex }: { stepIndex: number }) {
  const step = STEPS[stepIndex];
  const percent = ((stepIndex + 1) / STEPS.length) * 100;
  return (
    <div className="relative overflow-hidden rounded-t-2xl">
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="uppercase tracking-widest text-xs font-semibold text-white/90 mb-2">FlashFire — Client Onboarding</p>
            <h2 className="text-2xl font-bold mb-2">
              Step {stepIndex + 1} of {STEPS.length}: {step.title}
            </h2>
            <p className="text-white/95 text-base">{step.blurb}</p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="inline-block rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-sm">All fields required</span>
          </div>
        </div>
      </div>
      <div className="h-2 w-full bg-gray-100">
        <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function FieldLabel({ children, required = true }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-gray-800 mb-2">
      {children} {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200",
        "hover:border-gray-400",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={[
        "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder:text-gray-500",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200",
        "hover:border-gray-400 resize-none",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={[
        "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900",
        "focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200",
        "hover:border-gray-400 cursor-pointer",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-2 text-sm text-red-600 font-medium">{children}</p>;
}

/** ---------- Local file upload ---------- */
async function uploadFileLocally(file: File, fileType: 'resume' | 'coverLetter' | 'transcript') {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
  
  // Get token and user details from localStorage
  const userAuth = JSON.parse(localStorage.getItem('userAuth') || '{}');
  const token = userAuth.token;
  const email = userAuth.userDetails?.email;
  
  if (!token || !email) {
    throw new Error("Authentication required");
  }

  // Create FormData for file upload
  const formData = new FormData();
  formData.append('file', file);
  formData.append('email', email);
  formData.append('token', token);
  formData.append('userDetails', JSON.stringify(userAuth.userDetails));

  const response = await fetch(`${API_BASE_URL}/upload-profile-file`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Upload failed');
  }

  const data = await response.json();
  return data.secure_url || data.url;
}

// Helper function to convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

/** ---------- FileInput that uploads instantly ---------- */
function FileInput({
  label,
  required,
  file,
  onFileChange,
  onUploaded, // returns the secure_url
}: {
  label: string;
  required?: boolean;
  file: File | null | undefined;
  onFileChange: (f: File | null) => void;
  onUploaded: (url: string) => void;
}) {
  const [error, setError] = useState<string>("");
  const [uploading, setUploading] = useState(false);

  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <div className="relative">
        <input
          type="file"
          className="block w-full cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700 transition-all duration-200 hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          accept=".pdf,.doc,.docx,.txt"
          onChange={async (e) => {
            const f = e.currentTarget.files?.[0] ?? null;
            if (!f) {
              onFileChange(null);
              return;
            }
            const max = 10 * 1024 * 1024; // 10 MB
            if (f.size > max) {
              setError("File too large. Max 10 MB.");
              onFileChange(null);
              return;
            }
            setError("");
            onFileChange(f);

            setUploading(true);
            try {
              // Determine file type based on label
              const fileType = label.toLowerCase().includes('resume') ? 'resume' : label.toLowerCase().includes('transcript') ? 'transcript' : 'coverLetter';
              const url = await uploadFileLocally(f, fileType);
              onUploaded(url);
            } catch (err: any) {
              setError(err?.message || "Upload failed");
              onFileChange(null);
            } finally {
              setUploading(false);
            }
          }}
        />
        <div className="mt-3 flex items-center gap-3 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            PDF, DOC, DOCX, TXT · Max 10 MB
          </span>
          {file && (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-green-800 text-xs font-medium">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              {file.name}
            </span>
          )}
          {uploading && (
            <span className="flex items-center gap-1 text-blue-600">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Uploading…
            </span>
          )}
        </div>
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

/** ---------- Main ---------- */
export default function NewUserModal({ 
  setUserProfileFormVisibility, 
  mode = 'create',
  startSection = 'personal',
  onProfileComplete
}: { 
  setUserProfileFormVisibility: (v: boolean) => void;
  mode?: 'create' | 'edit';
  startSection?: ModalSection;
  onProfileComplete?: () => void;
}) {
const [stepIndex, setStepIndex] = useState<number>(() => sectionToStep[startSection] ?? 0);
    // at the top of NewUserModal
const EDIT_PASSCODE = import.meta.env.VITE_EDIT_PASSCODE || "2025"; // fallback for dev

const [showPasscode, setShowPasscode] = useState(false);
const [passcode, setPasscode] = useState("");
const [passErr, setPassErr] = useState("");
const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const [data, setData] = useState<FormData>({ ...initialData });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isLast = stepIndex === STEPS.length - 1;
  const ctx = useContext(UserContext);
  const set = (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch }));
  const { setProfileFromApi, isProfileComplete } = useUserProfile();
  // at top: import React, { useContext, useMemo, useState, useEffect } from "react";
// ...
const { userProfile: ctxProfile } = useUserProfile();

function addrToString(addr: any): string {
  if (!addr) return "";
  if (typeof addr === "string") return addr;
  const street   = addr.street ?? "";
  const city     = addr.city ?? "";
  const state    = addr.state ?? "";
  const zip      = addr.zip ?? addr.zipCode ?? "";
  // omit country in the single-line field, add if you want:
  return [street, city, state, zip].filter(Boolean).join(", ");
}
const arrToLine = (v: any) =>
  Array.isArray(v) ? v.join("; ") : (typeof v === "string" ? v : "");

const toMonth = (v?: string) => (v ? v.slice(0, 7) : "");   // YYYY-MM
const toDate  = (v?: string) => (v ? v.slice(0, 10) : "");  // YYYY-MM-DD

const handleSuccessClose = () => {
  setShowSuccessPopup(false);
  setUserProfileFormVisibility(false); // Close the modal
  onProfileComplete?.(); // Call the callback if provided
};

useEffect(() => {
  if (mode !== "edit") return;

  // Prefer context; fall back to localStorage userAuth.userProfile
  const ls = (() => {
    try { return JSON.parse(localStorage.getItem("userAuth") || "{}"); }
    catch { return {}; }
  })();
  const p: any = ctxProfile ?? ls?.userProfile;
  if (!p) return;

  setData((prev) => ({
    ...prev,
    // Step 0 — personal & education
    firstName: p.firstName ?? "",
    lastName: p.lastName ?? "",
    contactNumber: p.contactNumber ?? "",
    dob: toDate(p.dob),
    bachelorsUniDegree: p.bachelorsUniDegree ?? "",
    bachelorsGradMonthYear: toMonth(p.bachelorsGradMonthYear),
    bachelorsGPA: p.bachelorsGPA ?? "",
    mastersUniDegree: p.mastersUniDegree ?? "",
    mastersGradMonthYear: toMonth(p.mastersGradMonthYear),
    mastersGPA: p.mastersGPA ?? "",
    visaStatus: p.visaStatus ?? "",
    visaExpiry: toDate(p.visaExpiry),
    address: addrToString(p.address),

    // Step 1 — preferences & experience (form expects single lines)
    preferredRoles: arrToLine(p.preferredRoles),
    experienceLevel: p.experienceLevel ?? "",
    expectedSalaryRange: p.expectedSalaryRange ?? "",
    preferredLocations: arrToLine(p.preferredLocations),
    targetCompanies: arrToLine(p.targetCompanies),
    reasonForLeaving: p.reasonForLeaving ?? "",
    expectedSalaryNarrative: p.expectedSalaryNarrative ?? "",
    ssnNumber: p.ssnNumber ?? "",
    availabilityNote: p.availabilityNote ?? "",

    // Step 2 — links & docs
    linkedinUrl: p.linkedinUrl ?? "",
    githubUrl: p.githubUrl ?? "",
    portfolioUrl: p.portfolioUrl ?? "",
    coverLetterUrl: p.coverLetterUrl ?? "",
    resumeUrl: p.resumeUrl ?? "",
    transcriptUrl: p.transcriptUrl ?? "",
    confirmAccuracy: Boolean(p.confirmAccuracy),
    agreeTos: Boolean(p.agreeTos),
  }));
}, [mode, ctxProfile]);


  const validateUrl = (v: string) => {
    if (!v.trim()) return false;
    try {
      // Must start with http:// or https://
      if (!v.startsWith('http://') && !v.startsWith('https://')) {
        return false;
      }
      new URL(v);
      return true;
    } catch {
      return false;
    }
  };

  // Function to validate URL format in real-time
  const isValidUrlFormat = (v: string) => {
    if (!v.trim()) return true; // Empty is valid (will be checked as required separately)
    return /^https?:\/\/.+/.test(v);
  };

  const digitsOnly = (v: string) => v.replace(/\D/g, "");

  const validateStep = (index: number) => {
    const e: Record<string, string> = {};
    if (index === 0) {
      if (!data.firstName.trim()) e.firstName = "Required";
      if (!data.lastName.trim()) e.lastName = "Required";
      const phone = digitsOnly(data.contactNumber);
      if (!phone) e.contactNumber = "Required";
      else if (phone.length < 10) e.contactNumber = "Enter a valid number";
      if (!data.dob) e.dob = "Required";
      if (!data.bachelorsUniDegree.trim()) e.bachelorsUniDegree = "Required";
      if (!data.bachelorsGradMonthYear) e.bachelorsGradMonthYear = "Required";
      if (!data.mastersUniDegree.trim()) e.mastersUniDegree = "Required";
      if (!data.mastersGradMonthYear) e.mastersGradMonthYear = "Required";
      if (!data.visaStatus) e.visaStatus = "Required";
      if (!data.address.trim()) e.address = "Required";
    } else if (index === 1) {
      if (!data.preferredRoles.trim()) e.preferredRoles = "Required";
      if (!data.experienceLevel) e.experienceLevel = "Required";
      if (!data.expectedSalaryRange) e.expectedSalaryRange = "Required";
      if (!data.preferredLocations.trim()) e.preferredLocations = "Required";
      if (!data.targetCompanies.trim()) e.targetCompanies = "Required";
      
      // SSN validation - optional but must be empty or exactly 9 digits
      if (data.ssnNumber && data.ssnNumber.length > 0 && data.ssnNumber.length !== 9) {
        e.ssnNumber = "SSN must be exactly 9 digits or left empty";
      }
    } else if (index === 2) {
      // LinkedIn URL - required and must be valid URL
      if (!data.linkedinUrl.trim() || !validateUrl(data.linkedinUrl)) {
        e.linkedinUrl = "Valid LinkedIn URL required";
      }
      
      // GitHub URL - optional but must be valid URL if provided
      if (data.githubUrl.trim() && !validateUrl(data.githubUrl)) {
        e.githubUrl = "Valid GitHub URL required";
      }
      
      // Portfolio URL - optional but must be valid URL if provided
      if (data.portfolioUrl.trim() && !validateUrl(data.portfolioUrl)) {
        e.portfolioUrl = "Valid portfolio URL required";
      }

      // Resume - required
      if (!data.resumeUrl?.trim()) {
        e.resumeUrl = "Resume upload is required";
      }

      if (!data.confirmAccuracy) e.confirmAccuracy = "You must confirm accuracy";
      if (!data.agreeTos) e.agreeTos = "You must agree to the Terms";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validateStep(stepIndex)) setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
  };
  const back = () => setStepIndex((i) => Math.max(i - 1, 0));

  useEffect(() => {
  setStepIndex(sectionToStep[startSection] ?? 0);
}, [startSection]);


  // replace your handleSubmit with this pair:
const submitForm = async () => {
  try {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
    const { coverLetterFile, resumeFile, transcriptFile, ...payload } = data;

    // Get token from context or localStorage as fallback
    const token = ctx?.token || JSON.parse(localStorage.getItem('userAuth') || '{}')?.token;
    const email = ctx?.userDetails?.email || JSON.parse(localStorage.getItem('userAuth') || '{}')?.userDetails?.email;
    
    if (!token || !email) {
      throw new Error(JSON.stringify({ message: "Token or user details missing" }));
    }

    const res = await fetch(`${API_BASE_URL}/setprofile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...payload, email, token, userDetails: ctx?.userDetails }),
    });

    const resJson = await res.json();

    // ✅ only persist when request is OK
    if (!res.ok) throw new Error(JSON.stringify(resJson));

    // ✅ robustly pick the profile from common API shapes
    const payloadFromApi =
      resJson?.userProfile ??
      resJson?.data?.userProfile ??
      resJson?.data ??
      resJson;

    // ✅ this normalizes + persists to localStorage.userAuth.userProfile via context
    setProfileFromApi(payloadFromApi);

    console.log('Profile saved successfully:', payloadFromApi);
    console.log('Profile completion status:', isProfileComplete());

    // Show success popup instead of immediately closing
    setShowSuccessPopup(true);
    
  } catch (err: any) {
    console.error(err);
    const msg = (() => { try { return JSON.parse(err.message)?.message; } catch { return err.message; } })();
    alert(msg || "Something went wrong while submitting. Please try again.");
  }
};

const handleSubmit = () => {
  // Remove passcode requirement for development
  // if (mode === "edit") {
  //   const pin = window.prompt("Enter passcode to update profile:");
  //   if (pin !== EDIT_PASSCODE) return alert("Incorrect passcode");
  // }
  submitForm();
};



  const page = useMemo(() => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="space-y-8">
            {/* Personal Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Personal Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel>First Name</FieldLabel>
                  <TextInput value={data.firstName} onChange={(e) => set({ firstName: e.target.value })} placeholder="Enter your first name" />
                  <ErrorText>{errors.firstName}</ErrorText>
                </div>
                <div>
                  <FieldLabel>Last Name</FieldLabel>
                  <TextInput value={data.lastName} onChange={(e) => set({ lastName: e.target.value })} placeholder="Enter your last name" />
                  <ErrorText>{errors.lastName}</ErrorText>
                </div>
                <div>
                  <FieldLabel>Contact Number</FieldLabel>
                  <TextInput inputMode="tel" placeholder="Enter your phone number" value={data.contactNumber} onChange={(e) => set({ contactNumber: e.target.value })} />
                  <ErrorText>{errors.contactNumber}</ErrorText>
                </div>
                <div>
                  <FieldLabel>Date of Birth</FieldLabel>
                  <TextInput type="date" placeholder="Select your date of birth" value={data.dob} onChange={(e) => set({ dob: e.target.value })} />
                  <ErrorText>{errors.dob}</ErrorText>
                </div>
              </div>
            </div>

            {/* Education Information Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Education Information</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel>Bachelor's University Name & Degree (with Duration)</FieldLabel>
                    <TextInput placeholder="Enter your bachelor's degree details" value={data.bachelorsUniDegree} onChange={(e) => set({ bachelorsUniDegree: e.target.value })} />
                    <ErrorText>{errors.bachelorsUniDegree}</ErrorText>
                  </div>
                  <div>
                    <FieldLabel>Bachelor's Graduation Month & Year</FieldLabel>
                    <TextInput type="month" placeholder="Select graduation month and year" value={data.bachelorsGradMonthYear} onChange={(e) => set({ bachelorsGradMonthYear: e.target.value })} />
                    <ErrorText>{errors.bachelorsGradMonthYear}</ErrorText>
                  </div>
                  <div>
                    <FieldLabel>Bachelor's GPA</FieldLabel>
                    <TextInput 
                      type="text" 
                      placeholder="Enter your GPA (e.g., 3.8)" 
                      value={data.bachelorsGPA} 
                      onChange={(e) => set({ bachelorsGPA: e.target.value })} 
                    />
                    <ErrorText>{errors.bachelorsGPA}</ErrorText>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <FieldLabel>Master's University Name & Degree (with Duration)</FieldLabel>
                    <TextInput placeholder="Enter your master's degree details" value={data.mastersUniDegree} onChange={(e) => set({ mastersUniDegree: e.target.value })} />
                    <ErrorText>{errors.mastersUniDegree}</ErrorText>
                  </div>
                  <div>
                    <FieldLabel>Master's Graduation Month & Year</FieldLabel>
                    <TextInput type="month" placeholder="Select graduation month and year" value={data.mastersGradMonthYear} onChange={(e) => set({ mastersGradMonthYear: e.target.value })} />
                    <ErrorText>{errors.mastersGradMonthYear}</ErrorText>
                  </div>
                  <div>
                    <FieldLabel>Master's GPA</FieldLabel>
                    <TextInput 
                      type="text" 
                      placeholder="Enter your GPA (e.g., 3.9)" 
                      value={data.mastersGPA} 
                      onChange={(e) => set({ mastersGPA: e.target.value })} 
                    />
                    <ErrorText>{errors.mastersGPA}</ErrorText>
                  </div>
                </div>
              </div>
            </div>

            {/* Immigration & Address Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Immigration & Address</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel>Current Visa Status</FieldLabel>
                  <Select value={data.visaStatus} onChange={(e) => set({ visaStatus: e.target.value })}>
                    <option value="">Select status…</option>
                    {VISA_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </Select>
                  <ErrorText>{errors.visaStatus}</ErrorText>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Complete Current Address (Street, City, State, ZIP Code)</FieldLabel>
                  <TextArea rows={3} placeholder="Enter your complete address" value={data.address} onChange={(e) => set({ address: e.target.value })} />
                  <ErrorText>{errors.address}</ErrorText>
                </div>
              </div>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="space-y-8">
            {/* Job Preferences Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Job Preferences</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel>Preferred Job Roles</FieldLabel>
                  <TextInput placeholder="Enter your preferred job roles" value={data.preferredRoles} onChange={(e) => set({ preferredRoles: e.target.value })} />
                  <ErrorText>{errors.preferredRoles}</ErrorText>
                </div>
                <div>
                  <FieldLabel>Experience Level</FieldLabel>
                  <Select value={data.experienceLevel} onChange={(e) => set({ experienceLevel: e.target.value })}>
                    <option value="">Select level…</option>
                    {EXPERIENCE_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </Select>
                  <ErrorText>{errors.experienceLevel}</ErrorText>
                </div>
                <div>
                  <FieldLabel>Expected Base Salary Range</FieldLabel>
                  <Select value={data.expectedSalaryRange} onChange={(e) => set({ expectedSalaryRange: e.target.value })}>
                    <option value="">Select range…</option>
                    {SALARY_OPTIONS.map((v) => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                  </Select>
                  <ErrorText>{errors.expectedSalaryRange}</ErrorText>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel required={false}>Salary Note (Optional)</FieldLabel>
                  <TextInput
                    placeholder="Enter your salary expectations and requirements"
                    value={data.expectedSalaryNarrative}
                    onChange={(e) => set({ expectedSalaryNarrative: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Location & Company Preferences */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Location & Company Preferences</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel>Preferred Job Locations</FieldLabel>
                  <TextInput placeholder="Enter your preferred job locations" value={data.preferredLocations} onChange={(e) => set({ preferredLocations: e.target.value })} />
                  <ErrorText>{errors.preferredLocations}</ErrorText>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Companies You're Targeting</FieldLabel>
                  <TextInput placeholder="Enter companies you want to work for" value={data.targetCompanies} onChange={(e) => set({ targetCompanies: e.target.value })} />
                  <ErrorText>{errors.targetCompanies}</ErrorText>
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Additional Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <FieldLabel required={false}>SSN Number (Optional - must be exactly 9 digits)</FieldLabel>
                  <TextInput
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="Enter 9-digit SSN or leave empty"
                    value={data.ssnNumber}
                    onChange={(e) => {
                      const digits = digitsOnly(e.target.value).slice(0, 9);
                      set({ ssnNumber: digits });
                    }}
                  />
                  {data.ssnNumber && data.ssnNumber.length > 0 && data.ssnNumber.length !== 9 && (
                    <p className="mt-2 text-sm text-amber-600 font-medium">SSN must be exactly 9 digits or left empty</p>
                  )}
                  <ErrorText>{errors.ssnNumber}</ErrorText>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel required={false}>Reason for Leaving Your Previous Role (Optional)</FieldLabel>
                  <TextArea rows={3} placeholder="Explain why you left your previous role" value={data.reasonForLeaving} onChange={(e) => set({ reasonForLeaving: e.target.value })} />
                  <ErrorText>{errors.reasonForLeaving}</ErrorText>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>How soon you can join the company?</FieldLabel>
                  <Select value={data.joinTime} onChange={(e) => set({ joinTime: e.target.value })}>
                    {JOIN_TIME_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </Select>
                  <ErrorText>{errors.joinTime}</ErrorText>
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel required={false}>Availability to Join (Optional)</FieldLabel>
                  <TextInput
                    placeholder="Enter your availability to start work"
                    value={data.availabilityNote}
                    onChange={(e) => set({ availabilityNote: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-8">
            {/* Professional Links Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Professional Links</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FieldLabel>LinkedIn URL</FieldLabel>
                  <TextInput 
                    placeholder="Enter your LinkedIn profile URL" 
                    value={data.linkedinUrl} 
                    onChange={(e) => {
                      const value = e.target.value;
                      set({ linkedinUrl: value });
                      // Real-time validation
                      if (value && !isValidUrlFormat(value)) {
                        setErrors(prev => ({ ...prev, linkedinUrl: "URL must start with http:// or https://" }));
                      } else {
                        setErrors(prev => ({ ...prev, linkedinUrl: "" }));
                      }
                    }}
                    className={data.linkedinUrl && !isValidUrlFormat(data.linkedinUrl) ? "border-red-500" : ""}
                  />
                  <ErrorText>{errors.linkedinUrl}</ErrorText>
                  {data.linkedinUrl && !isValidUrlFormat(data.linkedinUrl) && (
                    <p className="mt-2 text-sm text-red-600 font-medium">Please enter a valid URL starting with http:// or https://</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel required={false}>GitHub URL (Optional)</FieldLabel>
                  <TextInput 
                    placeholder="Enter your GitHub profile URL" 
                    value={data.githubUrl} 
                    onChange={(e) => {
                      const value = e.target.value;
                      set({ githubUrl: value });
                      // Real-time validation
                      if (value && !isValidUrlFormat(value)) {
                        setErrors(prev => ({ ...prev, githubUrl: "URL must start with http:// or https://" }));
                      } else {
                        setErrors(prev => ({ ...prev, githubUrl: "" }));
                      }
                    }}
                    className={data.githubUrl && !isValidUrlFormat(data.githubUrl) ? "border-red-500" : ""}
                  />
                  <ErrorText>{errors.githubUrl}</ErrorText>
                  {data.githubUrl && !isValidUrlFormat(data.githubUrl) && (
                    <p className="mt-2 text-sm text-red-600 font-medium">Please enter a valid URL starting with http:// or https://</p>
                  )}
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel required={false}>Portfolio Link (Optional)</FieldLabel>
                  <TextInput 
                    placeholder="Enter your portfolio website URL" 
                    value={data.portfolioUrl} 
                    onChange={(e) => {
                      const value = e.target.value;
                      set({ portfolioUrl: value });
                      // Real-time validation
                      if (value && !isValidUrlFormat(value)) {
                        setErrors(prev => ({ ...prev, portfolioUrl: "URL must start with http:// or https://" }));
                      } else {
                        setErrors(prev => ({ ...prev, portfolioUrl: "" }));
                      }
                    }}
                    className={data.portfolioUrl && !isValidUrlFormat(data.portfolioUrl) ? "border-red-500" : ""}
                  />
                  <ErrorText>{errors.portfolioUrl}</ErrorText>
                  {data.portfolioUrl && !isValidUrlFormat(data.portfolioUrl) && (
                    <p className="mt-2 text-sm text-red-600 font-medium">Please enter a valid URL starting with http:// or https://</p>
                  )}
                </div>
              </div>
            </div>

            {/* Document Upload Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Document Upload</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <FileInput
                    label="Cover Letter (Optional)"
                    required={false}
                    file={data.coverLetterFile ?? null}
                    onFileChange={(f) => set({ coverLetterFile: f })}
                    onUploaded={(url) => set({ coverLetterUrl: url })}
                  />
                  <ErrorText>{errors.coverLetterUrl}</ErrorText>
                </div>
                <div className="sm:col-span-2">
                  <FileInput
                    label="Resume"
                    required={true}
                    file={data.resumeFile ?? null}
                    onFileChange={(f) => set({ resumeFile: f })}
                    onUploaded={(url) => set({ resumeUrl: url })}
                  />
                  <ErrorText>{errors.resumeUrl}</ErrorText>
                </div>
                <div className="sm:col-span-2">
                  <FileInput
                    label="Transcript (Optional)"
                    required={false}
                    file={data.transcriptFile ?? null}
                    onFileChange={(f) => set({ transcriptFile: f })}
                    onUploaded={(url) => set({ transcriptUrl: url })}
                  />
                  <ErrorText>{errors.transcriptUrl}</ErrorText>
                </div>
              </div>
            </div>

            {/* Consent Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">Consent & Agreement</h3>
              <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-6">
                <div className="flex items-start gap-4">
                  <input
                    id="confirm"
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={data.confirmAccuracy}
                    onChange={(e) => set({ confirmAccuracy: e.target.checked })}
                  />
                  <label htmlFor="confirm" className="text-sm text-gray-800 leading-relaxed">
                    I confirm that the information provided is accurate and can be used for job applications on my behalf.
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                </div>
                <ErrorText>{errors.confirmAccuracy}</ErrorText>

                <div className="flex items-start gap-4">
                  <input
                    id="tos"
                    type="checkbox"
                    className="mt-1 h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={data.agreeTos}
                    onChange={(e) => set({ agreeTos: e.target.checked })}
                  />
                  <label htmlFor="tos" className="text-sm text-gray-800 leading-relaxed">
                    I agree to the Terms of Service and Privacy Policy of FlashFire, and the conditions listed at
                    <a className="ml-1 underline decoration-blue-600 decoration-2 underline-offset-2 hover:text-blue-600" href="https://www.flashfirejobs.com/termsofservice" target="_blank" rel="noreferrer">
                      www.flashfirejobs.com/termsofservice
                    </a>
                    .
                    <span className="ml-1 text-red-500">*</span>
                  </label>
                </div>
                <ErrorText>{errors.agreeTos}</ErrorText>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [stepIndex, data, errors]);

  // removed: if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative z-10 mx-auto w-full max-w-6xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <Header stepIndex={stepIndex} />

        <div className="max-h-[65vh] overflow-y-auto p-8">{page}</div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4 border-t border-gray-200 bg-gray-50 px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={back}
              disabled={stepIndex === 0}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-6 py-2 text-sm font-medium text-gray-700 enabled:hover:bg-gray-50 disabled:opacity-40 transition-colors duration-200"
            >
              Back
            </button>
            {!isLast ? (
              <button
                onClick={next}
                className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors duration-200"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="inline-flex items-center rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 transition-colors duration-200"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Success Popup Component */}
      {showSuccessPopup && <SuccessPopup onClose={handleSuccessClose} />}
    </div>
  );
}

// Success Popup Component
function SuccessPopup({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60]">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-6 shadow-lg">
            <Check className="w-10 h-10 text-white" />
          </div>
          
          {/* Success Message */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Profile Completed Successfully!
          </h3>
          
          <p className="text-gray-600 mb-8 text-base leading-relaxed">
            Your profile has been saved and you can now access the dashboard. We'll use this information to help you find the best job opportunities.
          </p>
          
          {/* OK Button */}
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm"
          >
            Continue to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
