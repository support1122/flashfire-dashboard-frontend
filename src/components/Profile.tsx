import React, { useMemo, useState } from "react";
import { Pencil, Link as LinkIcon, FileText, CreditCard, GraduationCap, Building2, Edit3Icon } from "lucide-react";
import { useUserProfile, UserProfile } from "../state_management/ProfileContext";
import NewUserModal from "./NewUserModal";
/**
 * ProfilePage (No animations, simple & professional)
 * - Orange + White theme
 * - Left sidebar tabs: Personal, Education, Professional, Preferences, Links & Docs, Compliance
 * - Pulls data from UserProfileContext (localStorage-backed userAuth.userProfile)
 * - Plug into a route like: <Route path="/profile" element={<ProfilePage onEdit={(k)=>setUserProfileFormVisibility(true)} />} />
 */

const SECTIONS = [
  { key: "personal", label: "Personal", icon: CreditCard },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "professional", label: "Professional", icon: Building2 },
  { key: "preferences", label: "Preferences", icon: FileText },
  { key: "links", label: "Links & Docs", icon: LinkIcon },
  { key: "compliance", label: "Compliance", icon: FileText },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

type CardProps = { children: React.ReactNode; title: string; onEdit?: () => void };

function Placeholder({ label }: { label?: string }) {
  return <span className="text-gray-400">{label || "—"}</span>;
}

function InfoRow({ title, value }: { title: string; value?: string | React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-sm font-medium text-gray-900 text-right max-w-[65%] break-words">
        {value ? value : <Placeholder />}
      </div>
    </div>
  );
}

function Card({ children, title, onEdit }: CardProps) {
  return (
    <div className="rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between border-b border-orange-100 px-4 py-3">
        <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        {onEdit && (
          <button
            onClick={onEdit}
            className="inline-flex items-center gap-1 rounded-xl border border-orange-200 bg-white px-2.5 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-50"
          >
            <Pencil size={14} /> Edit
          </button>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function joinArr(v?: string[] | null) {
  if (!v || v.length === 0) return "";
  return v.join(", ");
}

function formatAddress(addr?: UserProfile["address"]) {
  if (!addr) return "";
  const parts = [addr.street, addr.city, addr.state, addr.zipCode, addr.country].filter(Boolean);
  return parts.join(", ");
}

export default function ProfilePage({
  onEdit,
}: {
  onEdit?: (sectionKey?: SectionKey) => void;
}) {
  const { userProfile } = useUserProfile();
  const [active, setActive] = useState<SectionKey>("personal");

  const data = userProfile ?? ({} as UserProfile);
   const [showEditor, setShowEditor] = useState(false);
  const [startSection, setStartSection] = useState<'personal' | 'education' | 'professional' | 'preferences' | 'links' | 'compliance'>('personal');

  const handleEditClick = (section?: SectionKey) => {
  if (onEdit) onEdit(section);
  else openEditor(section);
};

  const openEditor = (section?: typeof startSection) => {
    // map any undefined to 'personal'
    setStartSection(section || 'personal');
    setShowEditor(true);
  }
  const fullName = useMemo(() => {
    const fn = data.firstName?.trim() || "";
    const ln = data.lastName?.trim() || "";
    return [fn, ln].filter(Boolean).join(" ") || "Your Name";
  }, [data.firstName, data.lastName]);

  const emptyState = !userProfile;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-orange-50/40">
      {/* Header */}
      <div className="relative">
        <div className="mx-auto max-w-6xl px-4 pt-8">
          <div className="rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-500 to-orange-400 p-6 text-white shadow-sm">
            <div className="flex gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-2 justify-between">
                <p className="text-xs/5 uppercase tracking-widest text-white/70">Profile</p>
                <h1 className="text-2xl font-semibold">{fullName}</h1>
                <p className="text-white/90">{joinArr(data.preferredRoles) || "Add your target role"}</p>
              </div>
{/* // inside the header block in ProfilePage */}
<button
  type="button"
  onClick={() => handleEditClick(active)}
  className="flex items-center gap-2 rounded-2xl bg-blue-500 hover:bg-blue-600 px-3 py-2 text-white"
>
  <Edit3Icon size={16} />
  Edit Profile
</button>
              
              <div className="flex items-center gap-2">
                {onEdit && (
                  <button
                    onClick={() => onEdit(active)}
                    className="rounded-xl bg-white/15 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/30 hover:bg-white/20"
                  >
                    Edit this section
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
       {/* <ProfilePage onEdit={openEditor} /> */}
      {showEditor && (
        <NewUserModal
          mode="edit"
          startSection={active}
          setUserProfileFormVisibility={setShowEditor}
        />
      )}
      {/* Layout */}
      <div className="mx-auto mt-6 max-w-6xl gap-6 px-4 pb-10 lg:grid lg:grid-cols-[260px,1fr]">
        {/* Sidebar */}
        <aside className="rounded-2xl border border-orange-100 bg-white p-2 shadow-sm">
          {SECTIONS.map(({ key, label, icon: Icon }) => {
            const isActive = key === active;
            return (
              <button
                key={key}
                onClick={() => setActive(key)}
                className={[
                  "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm",
                  isActive
                    ? "bg-orange-50 text-orange-700 ring-1 ring-orange-200"
                    : "text-gray-700 hover:bg-orange-50",
                ].join(" ")}
              >
                <Icon size={16} className={isActive ? "text-orange-600" : "text-gray-500"} />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </aside>

        {/* Main content */}
        <main className="mt-6 space-y-6 lg:mt-0">
          {emptyState && (
            <Card title="No Profile Found" onEdit={onEdit ? () => onEdit(active) : undefined}>
              <p className="text-sm text-gray-600">We couldn't find your profile yet. Please complete your details using the form to populate this page.</p>
            </Card>
          )}

          {!emptyState && active === "personal" && (
            <Card title="Personal Details" onEdit={onEdit ? () => onEdit("personal") : undefined}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow title="First Name" value={data.firstName} />
                <InfoRow title="Last Name" value={data.lastName} />
                <InfoRow title="Contact Number" value={data.contactNumber} />
                <InfoRow title="Date of Birth" value={data.dob} />
                <div className="sm:col-span-2">
                  <InfoRow title="Address" value={formatAddress(data.address)} />
                </div>
                <InfoRow title="Visa Status" value={data.visaStatus} />
                <InfoRow title="Visa Expiry" value={data.visaExpiry} />
              </div>
            </Card>
          )}

          {!emptyState && active === "education" && (
            <Card title="Education" onEdit={onEdit ? () => onEdit("education") : undefined}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InfoRow title="Bachelor’s (University • Degree • Duration)" value={data.bachelorsUniDegree} />
                </div>
                <InfoRow title="Bachelor’s Grad (MM-YYYY)" value={data.bachelorsGradMonthYear} />
                <div className="sm:col-span-2">
                  <InfoRow title="Master’s (University • Degree • Duration)" value={data.mastersUniDegree} />
                </div>
                <InfoRow title="Master’s Grad (MM-YYYY)" value={data.mastersGradMonthYear} />
              </div>
            </Card>
          )}

          {!emptyState && active === "professional" && (
            <Card title="Professional" onEdit={onEdit ? () => onEdit("professional") : undefined}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow title="Preferred Roles" value={joinArr(data.preferredRoles)} />
                <InfoRow title="Experience Level" value={data.experienceLevel} />
                <InfoRow title="Expected Base Salary" value={data.expectedSalaryRange} />
                <div className="sm:col-span-2">
                  <InfoRow title="Preferred Locations" value={joinArr(data.preferredLocations)} />
                </div>
                <div className="sm:col-span-2">
                  <InfoRow title="Target Companies" value={joinArr(data.targetCompanies)} />
                </div>
                <div className="sm:col-span-2">
                  <InfoRow title="Reason for Leaving" value={data.reasonForLeaving} />
                </div>
              </div>
            </Card>
          )}

          {!emptyState && active === "preferences" && (
            <Card title="Preferences" onEdit={onEdit ? () => onEdit("preferences") : undefined}>
              <div className="space-y-2 text-sm text-gray-600">
                <p>Use this section for any future preference fields you want to surface on the profile page.</p>
              </div>
            </Card>
          )}

          {!emptyState && active === "links" && (
            <Card title="Links & Documents" onEdit={onEdit ? () => onEdit("links") : undefined}>
              <div className="space-y-3">
                <InfoRow
                  title="LinkedIn"
                  value={
                    data.linkedinUrl ? (
                      <a className="text-orange-700 underline decoration-2 underline-offset-2 hover:text-orange-600" href={data.linkedinUrl} target="_blank" rel="noreferrer">
                        {data.linkedinUrl}
                      </a>
                    ) : undefined
                  }
                />
                <InfoRow
                  title="GitHub"
                  value={
                    data.githubUrl ? (
                      <a className="text-orange-700 underline decoration-2 underline-offset-2 hover:text-orange-600" href={data.githubUrl} target="_blank" rel="noreferrer">
                        {data.githubUrl}
                      </a>
                    ) : undefined
                  }
                />
                <InfoRow
                  title="Portfolio"
                  value={
                    data.portfolioUrl ? (
                      <a className="text-orange-700 underline decoration-2 underline-offset-2 hover:text-orange-600" href={data.portfolioUrl} target="_blank" rel="noreferrer">
                        {data.portfolioUrl}
                      </a>
                    ) : undefined
                  }
                />

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <InfoRow
                    title="Cover Letter"
                    value={
                      data.coverLetterUrl ? (
                        <a className="text-orange-700 underline decoration-2 underline-offset-2 hover:text-orange-600" href={data.coverLetterUrl} target="_blank" rel="noreferrer">
                          View Cover Letter
                        </a>
                      ) : undefined
                    }
                  />
                  <InfoRow
                    title="Resume"
                    value={
                      data.resumeUrl ? (
                        <a className="text-orange-700 underline decoration-2 underline-offset-2 hover:text-orange-600" href={data.resumeUrl} target="_blank" rel="noreferrer">
                          View Resume
                        </a>
                      ) : undefined
                    }
                  />
                </div>
              </div>
            </Card>
          )}

          {!emptyState && active === "compliance" && (
            <Card title="Compliance" onEdit={onEdit ? () => onEdit("compliance") : undefined}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InfoRow title="Confirmed Accuracy" value={data.confirmAccuracy ? "Yes" : "No"} />
                <InfoRow title="Agreed ToS" value={data.agreeTos ? "Yes" : "No"} />
              </div>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
