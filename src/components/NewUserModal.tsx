import React, { useMemo, useState } from "react";

// FlashFire — Client Onboarding Form (3‑step modal)
// TailwindCSS required for styling. No external UI libraries.
// Usage: <OnboardingModal open={isOpen} onClose={()=>setOpen(false)} onSubmit={(payload)=>console.log(payload)} />

const STEPS = [
  { key: "personal", title: "Personal & Education", blurb: "Tell us who you are and where you studied." },
  { key: "preferences", title: "Preferences & Experience", blurb: "Share your target roles, salary, and locations." },
  { key: "links", title: "Links, Documents & Consent", blurb: "Add URLs, upload documents, and confirm consent." },
] as const;

type StepKey = typeof STEPS[number]["key"];

type FormData = {
  firstName: string;
  lastName: string;
  contactNumber: string;
  dob: string; // yyyy-mm-dd
  bachelorsUniDegree: string; // name + degree + duration
  bachelorsGradMonthYear: string; // yyyy-mm
  mastersUniDegree: string; // name + degree + duration
  mastersGradMonthYear: string; // yyyy-mm
  visaStatus: string; // enum
  visaExpiry: string; // yyyy-mm-dd
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
  coverLetterFile?: File | null;
  resumeFile?: File | null;
  confirmAccuracy: boolean; // must be true
  agreeTos: boolean; // must be true
};

const initialData: FormData = {
  firstName: "",
  lastName: "",
  contactNumber: "",
  dob: "",
  bachelorsUniDegree: "",
  bachelorsGradMonthYear: "",
  mastersUniDegree: "",
  mastersGradMonthYear: "",
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
  confirmAccuracy: false,
  agreeTos: false,
};

const VISA_OPTIONS = [
  "CPT",
  "F1",
  "F1 OPT",
  "F1 STEM OPT",
  "H1B",
  "Green Card",
  "U.S. Citizen",
  "Other",
];

const EXPERIENCE_OPTIONS = [
  "Entry level",
  "0-2 Years",
  "0-3 Years",
  "0-4 Years",
  "0-5 Years",
  "0-6 Years",
  "0-7 Years",
  "Other",
];

const SALARY_OPTIONS = ["60k-100k", "100k-150k", "150k-200k", "Other"];

function Header({ stepIndex }: { stepIndex: number }) {
  const step = STEPS[stepIndex];
  const percent = ((stepIndex + 1) / STEPS.length) * 100;
  return (
    <div className="relative overflow-hidden rounded-t-2xl">
      <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="uppercase tracking-widest text-xs/5 text-white/80">FlashFire — Client Onboarding</p>
            <h2 className="mt-1 text-xl font-semibold">Step {stepIndex + 1} of {STEPS.length}: {step.title}</h2>
            <p className="mt-1 text-sm text-white/90">{step.blurb}</p>
          </div>
          <div className="hidden sm:block text-right">
            <span className="inline-block rounded-full bg-white/15 px-3 py-1 text-xs">All fields required</span>
          </div>
        </div>
      </div>
      <div className="h-1.5 w-full bg-black/5">
        <div className="h-full bg-gradient-to-r from-indigo-600 to-fuchsia-600" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

function FieldLabel({ children, required = true }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-900">
      {children} {required && <span className="text-rose-600">*</span>}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={[
        "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400",
        "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
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
        "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400",
        "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
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
        "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900",
        "focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30",
        props.className ?? "",
      ].join(" ")}
    />
  );
}

function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-rose-600">{children}</p>;
}

function FileInput({ label, required, file, onFileChange }: { label: string; required?: boolean; file: File | null | undefined; onFileChange: (f: File | null) => void }) {
  const [error, setError] = useState<string>("");
  return (
    <div>
      <FieldLabel required={required}>{label}</FieldLabel>
      <input
        type="file"
        className="mt-1 block w-full cursor-pointer rounded-xl border border-dashed border-gray-300 bg-white p-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-white hover:file:bg-indigo-500"
        accept=".pdf,.doc,.docx,.txt"
        onChange={(e) => {
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
        }}
      />
      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
        <span>Accepted: PDF, DOC, DOCX, TXT · Max 10 MB</span>
        {file && <span className="truncate rounded bg-gray-100 px-2 py-0.5 text-gray-700">{file.name}</span>}
      </div>
      <ErrorText>{error}</ErrorText>
    </div>
  );
}

export default function OnboardingModal({ open, onClose, onSubmit }: { open: boolean; onClose: () => void; onSubmit?: (data: FormData) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [data, setData] = useState<FormData>({ ...initialData });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const isLast = stepIndex === STEPS.length - 1;

  const set = (patch: Partial<FormData>) => setData((d) => ({ ...d, ...patch }));

  const validateUrl = (v: string) => /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/.*)?$/i.test(v);
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
      if (!data.visaExpiry) e.visaExpiry = "Required";
      if (!data.address.trim()) e.address = "Required";
    } else if (index === 1) {
      if (!data.preferredRoles.trim()) e.preferredRoles = "Required";
      if (!data.experienceLevel) e.experienceLevel = "Required";
      if (!data.expectedSalaryRange) e.expectedSalaryRange = "Required";
      if (!data.preferredLocations.trim()) e.preferredLocations = "Required";
      if (!data.targetCompanies.trim()) e.targetCompanies = "Required";
      if (!data.reasonForLeaving.trim()) e.reasonForLeaving = "Required";
    } else if (index === 2) {
      if (!data.linkedinUrl.trim() || !validateUrl(data.linkedinUrl)) e.linkedinUrl = "Valid URL required";
      if (!data.githubUrl.trim() || !validateUrl(data.githubUrl)) e.githubUrl = "Valid URL required";
      if (!data.portfolioUrl.trim() || !validateUrl(data.portfolioUrl)) e.portfolioUrl = "Valid URL required";
      if (!data.coverLetterFile) e.coverLetterFile = "Required";
      if (!data.resumeFile) e.resumeFile = "Required";
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

  const handleSubmit = () => {
    // Validate final step (and all previous just in case)
    for (let i = 0; i < STEPS.length; i++) {
      if (!validateStep(i)) {
        setStepIndex(i);
        return;
      }
    }
    onSubmit?.(data);
    onClose();
  };

  const page = useMemo(() => {
    switch (stepIndex) {
      case 0:
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <FieldLabel>First Name</FieldLabel>
              <TextInput value={data.firstName} onChange={(e) => set({ firstName: e.target.value })} placeholder="e.g., Pranjal" />
              <ErrorText>{errors.firstName}</ErrorText>
            </div>
            <div>
              <FieldLabel>Last Name</FieldLabel>
              <TextInput value={data.lastName} onChange={(e) => set({ lastName: e.target.value })} placeholder="e.g., Tripathi" />
              <ErrorText>{errors.lastName}</ErrorText>
            </div>
            <div>
              <FieldLabel>Contact Number</FieldLabel>
              <TextInput inputMode="tel" placeholder="e.g., 6291665147" value={data.contactNumber} onChange={(e) => set({ contactNumber: e.target.value })} />
              <ErrorText>{errors.contactNumber}</ErrorText>
            </div>
            <div>
              <FieldLabel>DOB</FieldLabel>
              <TextInput type="date" value={data.dob} onChange={(e) => set({ dob: e.target.value })} />
              <ErrorText>{errors.dob}</ErrorText>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Bachelor’s University Name & Degree (with Duration)</FieldLabel>
              <TextInput placeholder="e.g., UPES — B.Tech CSE (2019–2023)" value={data.bachelorsUniDegree} onChange={(e) => set({ bachelorsUniDegree: e.target.value })} />
              <ErrorText>{errors.bachelorsUniDegree}</ErrorText>
            </div>
            <div>
              <FieldLabel>Bachelor’s Graduation Month & Year</FieldLabel>
              <TextInput type="month" value={data.bachelorsGradMonthYear} onChange={(e) => set({ bachelorsGradMonthYear: e.target.value })} />
              <ErrorText>{errors.bachelorsGradMonthYear}</ErrorText>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Master’s University Name & Degree (with Duration)</FieldLabel>
              <TextInput placeholder="e.g., Northeastern — MS Data (2023–2025)" value={data.mastersUniDegree} onChange={(e) => set({ mastersUniDegree: e.target.value })} />
              <ErrorText>{errors.mastersUniDegree}</ErrorText>
            </div>
            <div>
              <FieldLabel>Master’s Graduation Year and Month</FieldLabel>
              <TextInput type="month" value={data.mastersGradMonthYear} onChange={(e) => set({ mastersGradMonthYear: e.target.value })} />
              <ErrorText>{errors.mastersGradMonthYear}</ErrorText>
            </div>

            <div>
              <FieldLabel>Current Visa Status</FieldLabel>
              <Select value={data.visaStatus} onChange={(e) => set({ visaStatus: e.target.value })}>
                <option value="">Select status…</option>
                {VISA_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </Select>
              <ErrorText>{errors.visaStatus}</ErrorText>
            </div>
            <div>
              <FieldLabel>Visa Expiration Date</FieldLabel>
              <TextInput type="date" value={data.visaExpiry} onChange={(e) => set({ visaExpiry: e.target.value })} />
              <ErrorText>{errors.visaExpiry}</ErrorText>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Complete Current Address (Street, City, State, ZIP Code)</FieldLabel>
              <TextArea rows={3} placeholder="Street, City, State, ZIP" value={data.address} onChange={(e) => set({ address: e.target.value })} />
              <ErrorText>{errors.address}</ErrorText>
            </div>
          </div>
        );
      case 1:
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Preferred Job Roles</FieldLabel>
              <TextInput placeholder="e.g., Data Analyst; ML Engineer" value={data.preferredRoles} onChange={(e) => set({ preferredRoles: e.target.value })} />
              <ErrorText>{errors.preferredRoles}</ErrorText>
            </div>

            <div>
              <FieldLabel>Experience Level</FieldLabel>
              <Select value={data.experienceLevel} onChange={(e) => set({ experienceLevel: e.target.value })}>
                <option value="">Select level…</option>
                {EXPERIENCE_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </Select>
              <ErrorText>{errors.experienceLevel}</ErrorText>
            </div>

            <div>
              <FieldLabel>Expected Base Salary Range</FieldLabel>
              <Select value={data.expectedSalaryRange} onChange={(e) => set({ expectedSalaryRange: e.target.value })}>
                <option value="">Select range…</option>
                {SALARY_OPTIONS.map((v) => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </Select>
              <ErrorText>{errors.expectedSalaryRange}</ErrorText>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Preferred Job Locations</FieldLabel>
              <TextInput placeholder="e.g., Bay Area; NYC; Remote" value={data.preferredLocations} onChange={(e) => set({ preferredLocations: e.target.value })} />
              <ErrorText>{errors.preferredLocations}</ErrorText>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Companies You’re Targeting</FieldLabel>
              <TextInput placeholder="e.g., Meta, Stripe, Databricks" value={data.targetCompanies} onChange={(e) => set({ targetCompanies: e.target.value })} />
              <ErrorText>{errors.targetCompanies}</ErrorText>
            </div>

            <div className="sm:col-span-2">
              <FieldLabel>Reason for Leaving Your Previous Role</FieldLabel>
              <TextArea rows={3} placeholder="Briefly explain your reason" value={data.reasonForLeaving} onChange={(e) => set({ reasonForLeaving: e.target.value })} />
              <ErrorText>{errors.reasonForLeaving}</ErrorText>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>LinkedIn URL</FieldLabel>
              <TextInput placeholder="https://www.linkedin.com/in/..." value={data.linkedinUrl} onChange={(e) => set({ linkedinUrl: e.target.value })} />
              <ErrorText>{errors.linkedinUrl}</ErrorText>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>GitHub URL</FieldLabel>
              <TextInput placeholder="https://github.com/username" value={data.githubUrl} onChange={(e) => set({ githubUrl: e.target.value })} />
              <ErrorText>{errors.githubUrl}</ErrorText>
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>Portfolio Link or any other URL links</FieldLabel>
              <TextInput placeholder="https://your-portfolio.com" value={data.portfolioUrl} onChange={(e) => set({ portfolioUrl: e.target.value })} />
              <ErrorText>{errors.portfolioUrl}</ErrorText>
            </div>

            <div>
              <FileInput label="Cover Letter (required)" required file={data.coverLetterFile ?? null} onFileChange={(f) => set({ coverLetterFile: f })} />
              <ErrorText>{errors.coverLetterFile}</ErrorText>
            </div>
            <div>
              <FileInput label="Resume (required)" required file={data.resumeFile ?? null} onFileChange={(f) => set({ resumeFile: f })} />
              <ErrorText>{errors.resumeFile}</ErrorText>
            </div>

            <div className="sm:col-span-2 space-y-3 rounded-xl border border-gray-200 p-4">
              <div className="flex items-start gap-3">
                <input id="confirm" type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={data.confirmAccuracy} onChange={(e) => set({ confirmAccuracy: e.target.checked })} />
                <label htmlFor="confirm" className="text-sm text-gray-800">
                  I confirm that the information provided is accurate and can be used for job applications on my behalf.
                  <span className="ml-1 text-rose-600">*</span>
                </label>
              </div>
              <ErrorText>{errors.confirmAccuracy}</ErrorText>

              <div className="flex items-start gap-3">
                <input id="tos" type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" checked={data.agreeTos} onChange={(e) => set({ agreeTos: e.target.checked })} />
                <label htmlFor="tos" className="text-sm text-gray-800">
                  I agree to the Terms of Service and Privacy Policy of FlashFire, and the conditions listed at
                  <a className="ml-1 underline decoration-indigo-600 decoration-2 underline-offset-2" href="https://www.flashfirejobs.com" target="_blank" rel="noreferrer">www.flashfirejobs.com</a>.
                  <span className="ml-1 text-rose-600">*</span>
                </label>
              </div>
              <ErrorText>{errors.agreeTos}</ErrorText>
            </div>
          </div>
        );
      default:
        return null;
    }
  }, [stepIndex, data, errors]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative z-10 mx-4 w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
        <Header stepIndex={stepIndex} />

        <div className="max-h-[70vh] overflow-y-auto p-6">
          {page}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3">
          <button
            onClick={onClose}
            className="inline-flex items-center rounded-xl px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={back}
              disabled={stepIndex === 0}
              className="inline-flex items-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 enabled:hover:bg-gray-50 disabled:opacity-40"
            >
              Back
            </button>
            {!isLast ? (
              <button
                onClick={next}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="inline-flex items-center rounded-xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              >
                Submit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
