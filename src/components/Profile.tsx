import React, { useMemo, useState, useContext, useEffect } from "react";
import { Pencil, Link as LinkIcon, FileText, CreditCard, GraduationCap, Building2, Save, X, ArrowLeft, Upload } from "lucide-react";
import { useUserProfile, UserProfile } from "../state_management/ProfileContext";
import { UserContext } from "../state_management/UserContext";
import { Link } from "react-router-dom";

const SECTIONS = [
  { key: "personal", label: "Personal", icon: CreditCard },
  { key: "education", label: "Education", icon: GraduationCap },
  { key: "professional", label: "Professional", icon: Building2 },
  { key: "preferences", label: "Preferences", icon: FileText },
  { key: "links", label: "Links & Docs", icon: LinkIcon },
  { key: "compliance", label: "Terms & Accuracy", icon: FileText },
  { key: "additional", label: "Additional Information", icon: FileText },
  { key: "credentials", label: "Account Access", icon: FileText },
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

function TextAreaRow({ 
  title, 
  value, 
  isEditing = false, 
  onValueChange = () => {} 
}: { 
  title: string; 
  value?: string;
  isEditing?: boolean;
  onValueChange?: (value: string) => void;
}) {
  return (
    <div className="flex items-start py-4 border-b border-gray-100 last:border-b-0">
      <div className="w-1/3 text-sm font-semibold text-gray-700 pt-2">{title}</div>
      <div className="w-2/3">
        {isEditing ? (
          <textarea
            value={value || ""}
            onChange={(e) => onValueChange(e.target.value)}
            className="w-full text-sm border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none rounded-lg"
            rows={3}
            placeholder={`Enter ${title.toLowerCase()}`}
          />
        ) : (
          <div className="text-sm text-gray-900 min-h-[60px]">
            {value ? value : <Placeholder />}
          </div>
        )}
      </div>
    </div>
  );
}

function FileUploadRow({ 
  title, 
  currentFile, 
  isEditing = false, 
  onFileChange = () => {} 
}: { 
  title: string; 
  currentFile?: string;
  isEditing?: boolean;
  onFileChange?: (file: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const ctx = useContext(UserContext);

  const uploadFileToBackend = async (file: File): Promise<string> => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
    const token = ctx?.token;
    const email = ctx?.userDetails?.email;

    if (!token || !email) {
      throw new Error("Authentication required");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", email);
    formData.append("token", token);
    formData.append("userDetails", JSON.stringify(ctx?.userDetails));

    const response = await fetch(`${API_BASE_URL}/upload-profile-file`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Upload failed");
    }

    const data = await response.json();
    return data.secure_url || data.url;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploadedUrl = await uploadFileToBackend(file);
      onFileChange(uploadedUrl);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-start py-4 border-b border-gray-100 last:border-b-0">
      <div className="w-1/3 text-sm font-semibold text-gray-700 pt-2">{title}</div>
      <div className="w-2/3">
        {isEditing ? (
          <div className="space-y-2">
            {currentFile && (
              <a className="text-blue-600 underline text-sm inline-block" href={currentFile} target="_blank" rel="noreferrer">
                View Current File
              </a>
            )}
            <div className="relative">
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                disabled={isUploading}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
              />
              {isUploading && (
                <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
                  <div className="text-sm text-gray-600">Uploading...</div>
                </div>
              )}
            </div>
            {uploadError && (
              <div className="text-red-600 text-sm">{uploadError}</div>
            )}
          </div>
        ) : (
          <div>
            {currentFile ? (
              <a className="text-blue-600 underline text-sm" href={currentFile} target="_blank" rel="noreferrer">
                View File
              </a>
            ) : (
              <span className="text-gray-400 italic text-sm">No file uploaded</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ children, title, onEdit, isEditing, onSave, onCancel }: CardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-xl font-bold text-gray-900">{title}</h3>
        {isEditing ? (
          <div className="flex items-center gap-3">
            <button
              onClick={onSave}
              className="inline-flex items-center gap-2 bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 rounded-lg transition-colors"
            >
              <Save size={16} /> Save Changes
            </button>
            <button
              onClick={onCancel}
              className="inline-flex items-center gap-2 border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <X size={16} /> Cancel
            </button>
          </div>
        ) : (
          onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 rounded-lg transition-colors"
            >
              <Pencil size={16} /> Edit
            </button>
          )
        )}
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
  const { userProfile, updateProfile } = useUserProfile();
  const [active, setActive] = useState<SectionKey>("personal");
  const [editingSection, setEditingSection] = useState<SectionKey | null>(null);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const ctx = useContext(UserContext);

  const data = userProfile ?? ({} as UserProfile);
  
  // Debug: Log the data to see what we're getting
  console.log('Profile data:', { 
    joinTime: data.joinTime, 
    userProfile: userProfile 
  });

  // Force re-render when userProfile changes
  useEffect(() => {
    console.log('Profile component re-rendered with new data:', userProfile);
  }, [userProfile]);

  // Add a key to force re-render when data changes
  const profileKey = useMemo(() => {
    return `${data.joinTime}-${Date.now()}`;
  }, [data.joinTime]);
  


  const handleEditClick = (section: SectionKey) => {
    setEditingSection(section);
    setEditData(data);
  };

  const handleSectionChange = (section: SectionKey) => {
    if (editingSection !== null) {
      alert("Please save or cancel your changes before switching sections.");
      return;
    }
    setActive(section);
  };

  const handleSave = async () => {
    try {
      // Require hardcoded key for saving
      const userKey = prompt("Enter the edit key to save changes:");
      if (userKey !== "flashfire2025") {
        alert("Incorrect edit key. Changes not saved.");
        return;
      }

      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
      const token = ctx?.token;
      const email = ctx?.userDetails?.email;

      if (!token || !email) {
        throw new Error("Token or user details missing");
      }

      const res = await fetch(`${API_BASE_URL}/setprofile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...editData, email, token, userDetails: ctx?.userDetails }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update profile");
      }

      const resJson = await res.json();
      updateProfile(editData);
      setEditingSection(null);
      setEditData({});
      alert("Profile updated successfully!");
    } catch (error: any) {
      console.error("Profile update error:", error);
      alert(error.message || "Failed to update profile");
    }
  };

  const handleCancel = () => {
    setEditingSection(null);
    setEditData({});
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
    <div key={profileKey} className="min-h-screen bg-gray-50">
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
                    disabled={editingSection !== null}
                    className={[
                      "flex w-full items-center gap-4 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : editingSection !== null
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
              <Card title="No Profile Found" onEdit={onEdit ? () => onEdit(active) : undefined}>
                <p className="text-sm text-gray-600">We couldn't find your profile yet. Please complete your details using the form to populate this page.</p>
              </Card>
            )}

            {!emptyState && active === "personal" && (
              <Card 
                title="Personal Details" 
                onEdit={() => handleEditClick("personal")}
                isEditing={editingSection === "personal"}
                onSave={handleSave}
                onCancel={handleCancel}
              >
                <InfoRow 
                  title="First Name" 
                  value={editingSection === "personal" ? editData.firstName : data.firstName}
                  isEditing={editingSection === "personal"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, firstName: value }))}
                />
                <InfoRow 
                  title="Last Name" 
                  value={editingSection === "personal" ? editData.lastName : data.lastName}
                  isEditing={editingSection === "personal"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, lastName: value }))}
                />
                <InfoRow 
                  title="Contact Number" 
                  value={editingSection === "personal" ? editData.contactNumber : data.contactNumber}
                  isEditing={editingSection === "personal"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, contactNumber: value }))}
                />
                <InfoRow 
                  title="Date of Birth"
                  value={editingSection === "personal" ? editData.dob : (data.dob ? new Date(data.dob).toLocaleDateString() : undefined)}
                  isEditing={editingSection === "personal"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, dob: value }))}
                />
                <TextAreaRow 
                  title="Address" 
                  value={editingSection === "personal" ? editData.address : data.address}
                  isEditing={editingSection === "personal"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, address: value }))}
                />
                <InfoRow 
                  title="Visa Status" 
                  value={editingSection === "personal" ? editData.visaStatus : data.visaStatus}
                  isEditing={editingSection === "personal"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, visaStatus: value }))}
                />
              </Card>
            )}

            {!emptyState && active === "education" && (
              <Card 
                title="Education" 
                onEdit={() => handleEditClick("education")}
                isEditing={editingSection === "education"}
                onSave={handleSave}
                onCancel={handleCancel}
              >
                <InfoRow 
                  title="Bachelor's (University • Degree • Duration)" 
                  value={editingSection === "education" ? editData.bachelorsUniDegree : data.bachelorsUniDegree}
                  isEditing={editingSection === "education"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, bachelorsUniDegree: value }))}
                />
                <InfoRow 
                  title="Bachelor's Grad (MM-YYYY)" 
                  value={editingSection === "education" ? editData.bachelorsGradMonthYear : (data.bachelorsGradMonthYear ? new Date(data.bachelorsGradMonthYear).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }) : undefined)}
                  isEditing={editingSection === "education"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, bachelorsGradMonthYear: value }))}
                />
                <InfoRow 
                  title="Bachelor's GPA" 
                  value={editingSection === "education" ? editData.bachelorsGPA : data.bachelorsGPA}
                  isEditing={editingSection === "education"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, bachelorsGPA: value }))}
                />
                <InfoRow 
                  title="Master's (University • Degree • Duration)" 
                  value={editingSection === "education" ? editData.mastersUniDegree : data.mastersUniDegree}
                  isEditing={editingSection === "education"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, mastersUniDegree: value }))}
                />
                <InfoRow 
                  title="Master's Grad (MM-YYYY)" 
                  value={editingSection === "education" ? editData.mastersGradMonthYear : (data.mastersGradMonthYear ? new Date(data.mastersGradMonthYear).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit' }) : undefined)}
                  isEditing={editingSection === "education"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, mastersGradMonthYear: value }))}
                />
                <InfoRow 
                  title="Master's GPA" 
                  value={editingSection === "education" ? editData.mastersGPA : data.mastersGPA}
                  isEditing={editingSection === "education"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, mastersGPA: value }))}
                />
                {data.transcriptUrl && (
                  <div className="flex items-center py-4 border-b border-gray-100 last:border-b-0">
                    <div className="w-1/3 text-sm font-semibold text-gray-700">Transcript</div>
                    <div className="w-2/3">
                      <a 
                        href={data.transcriptUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 underline flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Transcript
                      </a>
                    </div>
                  </div>
                )}
              </Card>
            )}

            {!emptyState && active === "professional" && (
              <Card 
                title="Professional" 
                onEdit={() => handleEditClick("professional")}
                isEditing={editingSection === "professional"}
                onSave={handleSave}
                onCancel={handleCancel}
              >
                <InfoRow 
                  title="Preferred Roles" 
                  value={editingSection === "professional" ? joinArr(editData.preferredRoles) : joinArr(data.preferredRoles)}
                  isEditing={editingSection === "professional"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, preferredRoles: value.split(',').map(s => s.trim()) }))}
                />
                <InfoRow 
                  title="Experience Level" 
                  value={editingSection === "professional" ? editData.experienceLevel : data.experienceLevel}
                  isEditing={editingSection === "professional"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, experienceLevel: value }))}
                />
                <InfoRow 
                  title="Expected Base Salary" 
                  value={editingSection === "professional" ? editData.expectedSalaryRange : data.expectedSalaryRange}
                  isEditing={editingSection === "professional"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, expectedSalaryRange: value }))}
                />
                <InfoRow 
                  title="Preferred Locations" 
                  value={editingSection === "professional" ? joinArr(editData.preferredLocations) : joinArr(data.preferredLocations)}
                  isEditing={editingSection === "professional"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, preferredLocations: value.split(',').map(s => s.trim()) }))}
                />
                <InfoRow 
                  title="Target Companies" 
                  value={editingSection === "professional" ? joinArr(editData.targetCompanies) : joinArr(data.targetCompanies)}
                  isEditing={editingSection === "professional"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, targetCompanies: value.split(',').map(s => s.trim()) }))}
                />
                <TextAreaRow 
                  title="Reason for Leaving" 
                  value={editingSection === "professional" ? editData.reasonForLeaving : data.reasonForLeaving}
                  isEditing={editingSection === "professional"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, reasonForLeaving: value }))}
                />
              </Card>
            )}

            {!emptyState && active === "preferences" && (
              <Card 
                title="Preferences" 
                onEdit={() => handleEditClick("preferences")}
                isEditing={editingSection === "preferences"}
                onSave={handleSave}
                onCancel={handleCancel}
              >
                <div className="text-sm text-gray-600">
                  <p>Use this section for any future preference fields you want to surface on the profile page.</p>
                </div>
              </Card>
            )}

            {!emptyState && active === "links" && (
              <Card 
                title="Links & Documents" 
                onEdit={() => handleEditClick("links")}
                isEditing={editingSection === "links"}
                onSave={handleSave}
                onCancel={handleCancel}
              >
                <InfoRow
                  title="LinkedIn"
                  value={editingSection === "links" ? editData.linkedinUrl : (data.linkedinUrl ? (
                    <a className="text-blue-600 underline" href={data.linkedinUrl} target="_blank" rel="noreferrer">
                      {data.linkedinUrl}
                    </a>
                  ) : undefined)}
                  isEditing={editingSection === "links"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, linkedinUrl: value }))}
                />
                <InfoRow
                  title="GitHub"
                  value={editingSection === "links" ? editData.githubUrl : (data.githubUrl ? (
                    <a className="text-blue-600 underline" href={data.githubUrl} target="_blank" rel="noreferrer">
                      {data.githubUrl}
                    </a>
                  ) : undefined)}
                  isEditing={editingSection === "links"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, githubUrl: value }))}
                />
                <InfoRow
                  title="Portfolio"
                  value={editingSection === "links" ? editData.portfolioUrl : (data.portfolioUrl ? (
                    <a className="text-blue-600 underline" href={data.portfolioUrl} target="_blank" rel="noreferrer">
                      {data.portfolioUrl}
                    </a>
                  ) : undefined)}
                  isEditing={editingSection === "links"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, portfolioUrl: value }))}
                />
                <FileUploadRow
                  title="Resume"
                  currentFile={data.resumeUrl}
                  isEditing={editingSection === "links"}
                  onFileChange={(file) => setEditData(prev => ({ ...prev, resumeUrl: file }))}
                />
                <FileUploadRow
                  title="Cover Letter"
                  currentFile={data.coverLetterUrl}
                  isEditing={editingSection === "links"}
                  onFileChange={(file) => setEditData(prev => ({ ...prev, coverLetterUrl: file }))}
                />
                <FileUploadRow
                  title="Portfolio File"
                  currentFile={data.portfolioFileUrl}
                  isEditing={editingSection === "links"}
                  onFileChange={(file) => setEditData(prev => ({ ...prev, portfolioFileUrl: file }))}
                />
              </Card>
            )}

            {!emptyState && active === "compliance" && (
              <Card 
                title="Terms & Accuracy" 
                onEdit={() => handleEditClick("compliance")}
                isEditing={editingSection === "compliance"}
                onSave={handleSave}
                onCancel={handleCancel}
              >
                <InfoRow 
                  title="SSN Number" 
                  value={editingSection === "compliance" ? editData.ssnNumber : (() => {
                    const ssn = data.ssnNumber;
                    if (!ssn || ssn.length < 3) return ssn;
                    return `***-**-${ssn.slice(-3)}`; // Show only last 3 digits
                  })()}
                  isEditing={editingSection === "compliance"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, ssnNumber: value }))}
                />
                <TextAreaRow 
                  title="Expected Salary Narrative" 
                  value={editingSection === "compliance" ? editData.expectedSalaryNarrative : data.expectedSalaryNarrative}
                  isEditing={editingSection === "compliance"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, expectedSalaryNarrative: value }))}
                />
                <InfoRow 
                  title="Join Time" 
                  value={editingSection === "compliance" ? editData.joinTime : data.joinTime}
                  isEditing={editingSection === "compliance"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, joinTime: value }))}
                />
                <InfoRow 
                  title="Confirm Accuracy" 
                  value={editingSection === "compliance" ? (editData.confirmAccuracy ? "Yes" : "No") : (data.confirmAccuracy ? "Yes" : "No")}
                  isEditing={editingSection === "compliance"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, confirmAccuracy: value === "Yes" }))}
                />
                <InfoRow 
                  title="Agree to Terms" 
                  value={editingSection === "compliance" ? (editData.agreeTos ? "Yes" : "No") : (data.agreeTos ? "Yes" : "No")}
                  isEditing={editingSection === "compliance"}
                  onValueChange={(value) => setEditData(prev => ({ ...prev, agreeTos: value === "Yes" }))}
                />
              </Card>
            )}

            {active === "additional" && (
              <Card title="Additional Information">
                <InfoRow 
                  title="Are you veteran?" 
                  value="No"
                />
                <InfoRow 
                  title="Do you have disability?" 
                  value="No"
                />
                <InfoRow 
                  title="Will you require scholarship?" 
                  value="No"
                />
                <InfoRow 
                  title="Are you eligible to work in United States?" 
                  value="Yes"
                />
                <TextAreaRow 
                  title="When are you able to join the company?" 
                  value={(() => {
                    const joinTime = data.joinTime;
                    if (!joinTime) {
                      return "I am available to start within 2 weeks of receiving offer.";
                    }
                    
                    // Convert join time to readable format
                    const timeMap: Record<string, string> = {
                      "in 1 week": "I am available to start within 1 week of receiving offer.",
                      "in 2 week": "I am available to start within 2 weeks of receiving offer.",
                      "in 3 week": "I am available to start within 3 weeks of receiving offer.",
                      "in 4 week": "I am available to start within 4 weeks of receiving offer.",
                      "in 6-7 week": "I am available to start within 6-7 weeks of receiving offer."
                    };
                    
                    return timeMap[joinTime] || "I am available to start within 2 weeks of receiving offer.";
                  })()}
                />
                <InfoRow 
                  title="How much salary are you expecting?" 
                  value={(() => {
                    const salaryRange = data.expectedSalaryRange;
                    if (!salaryRange || salaryRange === "Other") {
                      return "I'm seeking a salary in the range of $80,000 to $100,000 annually, depending on the overall compensation package, responsibilities, and growth opportunities within the role.";
                    }
                    
                    // Convert salary range to readable format
                    const rangeMap: Record<string, string> = {
                      "60k-100k": "$60,000 to $100,000",
                      "100k-150k": "$100,000 to $150,000", 
                      "150k-200k": "$150,000 to $200,000"
                    };
                    
                    const range = rangeMap[salaryRange] || "$80,000 to $100,000";
                    return `I'm seeking a salary in the range of ${range} annually, depending on the overall compensation package, responsibilities, and growth opportunities within the role.`;
                  })()}
                />
              </Card>
            )}

            {active === "credentials" && (
              <Card title="Account Access Credentials">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-semibold text-blue-800">Account Credentials</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    These are the credentials which you can use while applying in different portals.
                  </p>
                </div>
                
                <InfoRow 
                  title="Username / Email" 
                  value={ctx?.userDetails?.email || "Not available"}
                />
                <InfoRow 
                  title="Password" 
                  value="Flashfire@1357"
                />
                
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Important Notes:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Password is standardized across all dashboard accounts</li>
                    <li>• Keep these credentials secure and do not share with unauthorized personnel</li>
                    <li>• Contact support if you need to reset your credentials</li>
                  </ul>
                </div>
              </Card>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
