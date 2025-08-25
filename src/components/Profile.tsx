import React, { useMemo, useState, useContext } from "react";
import { Link as LinkIcon, FileText, CreditCard, GraduationCap, Building2, ArrowLeft } from "lucide-react";
import { useUserProfile, UserProfile } from "../state_management/ProfileContext";
import { UserContext } from "../state_management/UserContext";
import { Link } from "react-router-dom";

const SECTIONS = [
  { key: "personal", label: "Personal", icon: CreditCard },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "professional", label: "Professional", icon: Building2 },
  { key: "preferences", label: "Preferences", icon: FileText },
  { key: "links", label: "Links & Docs", icon: LinkIcon },
  { key: "compliance", label: "Compliance", icon: FileText },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

type CardProps = { 
  children: React.ReactNode; 
  title: string; 
  onEdit?: () => void;
  isEditing?: boolean;
  onSave?: () => void;
  onCancel?: () => void;
};

function Placeholder({ label }: { label?: string }) {
  return <span className="text-gray-400 italic">{label || "Not provided"}</span>;
}

function InfoRow({ 
  title, 
  value, 
  isEditing = false, 
  onValueChange = () => {} 
}: { 
  title: string; 
  value?: string | React.ReactNode;
  isEditing?: boolean;
  onValueChange?: (value: string) => void;
}) {
  return (
    <div className="flex items-center py-4 border-b border-gray-100 last:border-b-0">
      <div className="w-1/3 text-sm font-semibold text-gray-700">{title}</div>
      <div className="w-2/3">
        {isEditing ? (
          <input
            type="text"
            value={value as string || ""}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full text-sm border-b border-gray-300 px-2 py-1 focus:border-blue-500 focus:outline-none"
            placeholder={`Enter ${title.toLowerCase()}`}
          />
        ) : (
          <div className="text-sm text-gray-900">
            {value ? value : <Placeholder />}
          </div>
        )}
      </div>
    </div>
  );
}

function FileUploadRow({ 
  title, 
  currentFile
}: { 
  title: string; 
  currentFile?: string;
}) {
  return (
    <div className="flex items-start py-4 border-b border-gray-100 last:border-b-0">
      <div className="w-1/3 text-sm font-semibold text-gray-700 pt-2">{title}</div>
      <div className="w-2/3">
        {currentFile ? (
          <a className="text-blue-600 underline text-sm" href={currentFile} target="_blank" rel="noreferrer">
            View File
          </a>
        ) : (
          <span className="text-gray-400 italic text-sm">No file uploaded</span>
        )}
      </div>
    </div>
  );
}

function Card({ children, title }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

function joinArr(v?: string[] | null) {
  if (!v || v.length === 0) return "";
  return v.join(", ");
}

export default function ProfilePage({
  onEdit,
}: {
  onEdit?: (sectionKey?: SectionKey) => void;
}) {
  const { userProfile } = useUserProfile();
  const [active, setActive] = useState<SectionKey>("personal");
  const ctx = useContext(UserContext);

  const data = userProfile ?? ({} as UserProfile);

  const handleSectionChange = (section: SectionKey) => {
    setActive(section);
  };

  const fullName = useMemo(() => {
    const fn = data.firstName?.trim() || "";
    const ln = data.lastName?.trim() || "";
    return [fn, ln].filter(Boolean).join(" ") || "Your Name";
  }, [data.firstName, data.lastName]);

  const emptyState = !userProfile;

  if (!userProfile && !ctx?.userDetails) {
    return (
      <div className="min-h-[calc(100vh-64px)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-gray-900 mb-4">Profile Not Found</h1>
          <p className="text-gray-600">Please complete your profile first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-4">
                <Link 
                  to="/" 
                  className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 hover:bg-gray-200 transition-all duration-200"
                >
                  <ArrowLeft size={16} />
                  <span className="text-sm font-medium">Back to Dashboard</span>
                </Link>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold">Professional Profile</p>
                <h1 className="mt-2 text-3xl font-bold text-gray-900">{fullName}</h1>
                <p className="mt-1 text-gray-600 text-lg">{joinArr(data.preferredRoles) || "Add your target role"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[280px,1fr] gap-12">
          {/* Sidebar */}
          <aside className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Sections</h2>
            <div className="space-y-3">
              {SECTIONS.map(({ key, label, icon: Icon }) => {
                const isActive = key === active;
                return (
                  <button
                    key={key}
                    onClick={() => handleSectionChange(key)}
                    disabled={false} // Removed editingSection !== null
                    className={[
                      "flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : false // Removed editingSection !== null
                        ? "text-gray-400 cursor-not-allowed"
                        : "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
                    ].join(" ")}
                  >
                    <Icon size={18} className={isActive ? "text-white" : "text-gray-500"} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Main content */}
          <main className="space-y-8">
            {emptyState && (
              <Card title="No Profile Found">
                <p className="text-sm text-gray-600">We couldn't find your profile yet. Please complete your details using the form to populate this page.</p>
              </Card>
            )}

            {!emptyState && active === "personal" && (
              <Card title="Personal Details">
                <InfoRow 
                  title="First Name" 
                  value={data.firstName}
                />
                <InfoRow 
                  title="Last Name" 
                  value={data.lastName}
                />
                <InfoRow 
                  title="Contact Number" 
                  value={data.contactNumber}
                />
                <InfoRow 
                  title="Date of Birth"
                  value={data.dob ? new Date(data.dob).toLocaleDateString() : undefined}
                />
                <InfoRow 
                  title="Address" 
                  value={data.address}
                />
                <InfoRow 
                  title="Visa Status" 
                  value={data.visaStatus}
                />
              </Card>
            )}

            {!emptyState && active === "education" && (
              <Card title="Education">
                <InfoRow 
                  title="Bachelor's (University • Degree • Duration)" 
                  value={data.bachelorsUniDegree}
                />
                <InfoRow 
                  title="Bachelor's Grad (MM-YYYY)" 
                  value={data.bachelorsGradMonthYear ? new Date(data.bachelorsGradMonthYear).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }) : undefined}
                />
                <InfoRow 
                  title="Master's (University • Degree • Duration)" 
                  value={data.mastersUniDegree}
                />
                <InfoRow 
                  title="Master's Grad (MM-YYYY)" 
                  value={data.mastersGradMonthYear ? new Date(data.mastersGradMonthYear).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }) : undefined}
                />
              </Card>
            )}

            {!emptyState && active === "professional" && (
              <Card title="Professional">
                <InfoRow 
                  title="Preferred Roles" 
                  value={joinArr(data.preferredRoles)}
                />
                <InfoRow 
                  title="Experience Level" 
                  value={data.experienceLevel}
                />
                <InfoRow 
                  title="Expected Base Salary" 
                  value={data.expectedSalaryRange}
                />
                <InfoRow 
                  title="Preferred Locations" 
                  value={joinArr(data.preferredLocations)}
                />
                <InfoRow 
                  title="Target Companies" 
                  value={joinArr(data.targetCompanies)}
                />
                <InfoRow 
                  title="Reason for Leaving" 
                  value={data.reasonForLeaving}
                />
              </Card>
            )}

            {!emptyState && active === "preferences" && (
              <Card title="Preferences">
                <div className="text-sm text-gray-600">
                  <p>Use this section for any future preference fields you want to surface on the profile page.</p>
                </div>
              </Card>
            )}

            {!emptyState && active === "links" && (
              <Card title="Links & Documents">
                <InfoRow
                  title="LinkedIn"
                  value={data.linkedinUrl ? (
                    <a className="text-blue-600 underline" href={data.linkedinUrl} target="_blank" rel="noreferrer">
                      {data.linkedinUrl}
                    </a>
                  ) : undefined}
                />
                <InfoRow
                  title="GitHub"
                  value={data.githubUrl ? (
                    <a className="text-blue-600 underline" href={data.githubUrl} target="_blank" rel="noreferrer">
                      {data.githubUrl}
                    </a>
                  ) : undefined}
                />
                <InfoRow
                  title="Portfolio"
                  value={data.portfolioUrl ? (
                    <a className="text-blue-600 underline" href={data.portfolioUrl} target="_blank" rel="noreferrer">
                      {data.portfolioUrl}
                    </a>
                  ) : undefined}
                />
                <FileUploadRow
                  title="Resume"
                  currentFile={data.resumeUrl}
                />
                <FileUploadRow
                  title="Cover Letter"
                  currentFile={data.coverLetterUrl}
                />
                <FileUploadRow
                  title="Portfolio File"
                  currentFile={data.portfolioFileUrl}
                />
              </Card>
            )}

            {!emptyState && active === "compliance" && (
              <Card title="Compliance">
                <InfoRow 
                  title="SSN Number" 
                  value={data.ssnNumber}
                />
                <InfoRow 
                  title="Expected Salary Narrative" 
                  value={data.expectedSalaryNarrative}
                />
                <InfoRow 
                  title="Availability Note" 
                  value={data.availabilityNote}
                />
                <InfoRow 
                  title="Confirm Accuracy" 
                  value={data.confirmAccuracy ? "Yes" : "No"}
                />
                <InfoRow 
                  title="Agree to Terms" 
                  value={data.agreeTos ? "Yes" : "No"}
                />
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
