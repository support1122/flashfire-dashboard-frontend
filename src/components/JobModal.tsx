import {
  X,
  Briefcase,
  Calendar,
  User,
  FileText,
  ArrowRight,
  Link,
  Copy,
  ExternalLink,
  TimerIcon,
  Upload as UploadIcon,
  Check,
  Loader2,
} from "lucide-react";
import { useRef, useState, Suspense, lazy, useContext } from "react";
import LoadingScreen from "./LoadingScreen";
import { getTimeAgo } from "../utils/getTimeAgo.ts";
import { UserContext } from "../state_management/UserContext";
import { useUserJobs } from "../state_management/UserJobs.tsx"; // ⬅️ NEW

const AttachmentsModal = lazy(() => import("./AttachmentsModal"));

/* ---------- ENV ---------- */
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "";
const IMG_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  import.meta.env.VITE_CLOUDINARY_CLOUD_PRESET ||
  "";
const DOC_UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET_PDF ||
  import.meta.env.VITE_CLOUDINARY_CLOUD_PRESET_PDF ||
  IMG_UPLOAD_PRESET;

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const JOB_UPDATE_ENDPOINT = `${API_BASE}/api/jobs`;
const PLAN_ENDPOINT = `${API_BASE}/api/plans/select`;

/* ---------- Cloudinary uploader (unsigned) ---------- */
async function uploadToCloudinary(
  file: File,
  {
    resourceType = "auto",
    folder = "flashfirejobs",
    preset = IMG_UPLOAD_PRESET,
  }: { resourceType?: "auto" | "image" | "raw"; folder?: string; preset?: string } = {}
) {
  if (!CLOUD_NAME || !preset) throw new Error("Missing Cloudinary envs.");
  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", preset);
  fd.append("folder", folder);
  const res = await fetch(endpoint, { method: "POST", body: fd });
  if (!res.ok) throw new Error(await res.text());
  return res.json(); // { secure_url, ... }
}

/* ---------- Persist new image URLs into JobModel.attachments[] ---------- */
async function persistAttachmentsToJob({
  jobID,
  userEmail,
  urls,
  token,
}: {
  jobID: string;
  userEmail: string;
  urls: string[];
  token: string | null;
}) {
  const payload = {
    action: "edit",
    jobID,
    userDetails: { email: userEmail },
    attachmentUrls: urls,
    token,
  };

  const res = await fetch(JOB_UPDATE_ENDPOINT, {
    method: "PUT", // keep your POST /api/jobs with action=edit
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error((await res.text()) || "Failed to persist attachments");
  return res.json() as Promise<{ message?: string; updatedJobs?: any[] }>;
}

/* ---------- Persist optimized resume to UserModel via PlanSelect ---------- */
async function persistOptimizedResumeToUser({
  token,
  userEmail,
  entry,
}: {
  token: string | null;
  userEmail: string;
  entry: { url: string; companyName?: string; jobRole?: string; jobId?: string; jobLink?: string };
}) {
  const payload = {
    token,
    userDetails: { email: userEmail },
    optimizedResumeEntry: {
      url: entry.url,
      companyName: entry.companyName ?? "",
      jobRole: entry.jobRole ?? "",
      jobId: entry.jobId ?? "",
      jobLink: entry.jobLink ?? "",
    },
  };

  const res = await fetch(PLAN_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json: any = {};
  try {
    json = text ? JSON.parse(text) : {};
  } catch {}
  if (!res.ok) throw new Error((json && json.message) || text || "Failed to save optimized resume");
  return json as { message?: string; userDetails?: any };
}

type Sections = "details" | "link" | "description" | "attachments" | "timeline";

export default function JobModal({
  setShowJobModal,
  jobDetails,
}: {
  setShowJobModal: (v: boolean) => void;
  jobDetails: any;
}) {
  const ctx = useContext(UserContext);
  const token = ctx?.token ?? null;
  const setData = ctx?.setData ?? null;
  const currentUser = ctx?.userDetails ?? {};

  const { setUserJobs } = useUserJobs(); // ⬅️ NEW: global jobs updater

  const [attachmentsModalActiveStatus, setAttachmentsModalActiveStatus] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Sections>("details");

  // local image grid
  const [attachments, setAttachments] = useState<string[]>(() => jobDetails?.attachments || []);
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // optimized resume (document) — in DETAILS tab
  const docInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [recentDocUrl, setRecentDocUrl] = useState<string | null>(null);

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  /* ---------- Upload handlers ---------- */
  const handleImgUpload = async () => {
    setImgError(null);
    if (!imgFile) return;

    const jobID = jobDetails?.jobID;
    const userEmail = currentUser?.email;
    if (!jobID || !userEmail) {
      setImgError("Missing jobID or user email; cannot save attachment.");
      console.error("[handleImgUpload] Missing identifiers", { jobID, userEmail, jobDetails, currentUser });
      return;
    }

    if (!imgFile.type.startsWith("image/")) {
      setImgError("Please choose an image (png/jpg/webp).");
      return;
    }

    setIsUploadingImg(true);
    try {
      const up = await uploadToCloudinary(imgFile, {
        resourceType: "image",
        folder: "flashfirejobs/attachments",
        preset: IMG_UPLOAD_PRESET,
      });
      const url = up.secure_url as string;

      // optimistic grid
      setAttachments((prev) => [url, ...prev]);

      // persist to JobModel.attachments[]
      const resp = await persistAttachmentsToJob({
        jobID,
        userEmail,
        urls: [url],
        token,
      });

      // ⬅️ NEW: update global jobs list from server
      if (resp?.updatedJobs) {
        setUserJobs(resp.updatedJobs);

        // keep local grid perfectly in sync with server for this job
        const updated = resp.updatedJobs.find((j) => j.jobID === jobID);
        if (updated?.attachments) {
          setAttachments(updated.attachments);
        }
      }

      setImgFile(null);
    } catch (e: any) {
      setImgError(e.message || "Upload failed");
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleChooseDoc = () => docInputRef.current?.click();

  const handleDocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setDocError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const jobID = jobDetails?.jobID;
    const userEmail = currentUser?.email;
    if (!jobID || !userEmail) {
      setDocError("Missing jobID or user email; cannot add optimized resume.");
      console.error("[handleDocFileChange] Missing identifiers", { jobID, userEmail, jobDetails, currentUser });
      e.target.value = "";
      return;
    }

    const isDoc =
      file.type === "application/pdf" ||
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (!isDoc) {
      setDocError("Please select a PDF/DOC/DOCX file.");
      e.target.value = "";
      return;
    }

    setIsUploadingDoc(true);
    try {
      // 1) upload to Cloudinary as raw document
      const up = await uploadToCloudinary(file, {
        resourceType: "raw",
        folder: "flashfirejobs/docs",
        preset: DOC_UPLOAD_PRESET,
      });
      const url = up.secure_url as string;

      // 2) persist to user (PlanSelect + LocalTokenValidator)
      const resp = await persistOptimizedResumeToUser({
        token,
        userEmail,
        entry: {
          url,
          companyName: jobDetails?.companyName,
          jobRole: jobDetails?.jobTitle,
          jobId: jobDetails?.jobID,
          jobLink: jobDetails?.joblink,
        },
      });

      // 3) UPDATE CONTEXT + LOCALSTORAGE with server user details
      const serverUser = resp?.userDetails;
      if (serverUser) {
        const existingAuthRaw = localStorage.getItem("userAuth");
        const existingAuth = existingAuthRaw ? JSON.parse(existingAuthRaw) : {};
        const finalToken: string = (token as string) || existingAuth?.token || "";

        if (ctx?.setData && finalToken) {
          ctx.setData({ userDetails: serverUser, token: finalToken });
        } else {
          localStorage.setItem(
            "userAuth",
            JSON.stringify({ ...existingAuth, userDetails: serverUser, token: finalToken })
          );
        }
      }

      setRecentDocUrl(url);
      e.target.value = "";
    } catch (e: any) {
      setDocError(e.message || "Upload failed");
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const sections = [
    { id: "details", label: "Job Details", icon: FileText, color: "bg-blue-50 text-blue-700 border-blue-200" },
    { id: "link", label: "Job Link", icon: Link, color: "bg-green-50 text-green-700 border-green-200" },
    { id: "description", label: "Job Description", icon: Briefcase, color: "bg-purple-50 text-purple-700 border-purple-200" },
    { id: "attachments", label: "Resume / Attachments", icon: User, color: "bg-orange-50 text-orange-700 border-orange-200" },
    { id: "timeline", label: "Application Timeline", icon: TimerIcon, color: "bg-brown-800 text-orange-700 border-orange-200" },
  ] as const;

  const renderContent = () => {
    switch (activeSection) {
      case "details":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h4 className="text-sm font-medium text-gray-600 mb-6">Company Name</h4>
              <p className="text-lg flex gap-4 font-semibold text-gray-900">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${jobDetails.companyName}.com&sz=64`}
                  alt="Company Logo"
                  className="w-[30px] h-[30px] m-2"
                />
                {jobDetails.companyName}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center mb-2">
                <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Added On</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {jobDetails.createdAt ? getTimeAgo(jobDetails.createdAt) : "N/A"}
              </p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center mb-2">
                <Briefcase className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Position</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">{jobDetails.jobTitle}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center mb-2">
                <User className="w-4 h-4 text-gray-500 mr-2" />
                <span className="text-sm font-medium text-gray-600">Candidate</span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                {currentUser?.email || jobDetails.userID}
              </p>
            </div>

            {/* ---- Add Optimized Resume (DOCUMENT ONLY) ---- */}
            <div className="bg-white rounded-lg border border-blue-200 p-4">
              <div className="flex items-center mb-3">
                <UploadIcon className="w-4 h-4 text-blue-600 mr-2" />
                <h4 className="text-sm font-semibold text-blue-700">
                  Add Optimized Resume (PDF/DOC/DOCX)
                </h4>
              </div>

              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleDocFileChange}
                className="hidden"
              />

              <button
                onClick={handleChooseDoc}
                disabled={isUploadingDoc}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
              >
                {isUploadingDoc ? (
                  <Loader2 className="animate-spin w-4 h-4" />
                ) : (
                  <UploadIcon className="w-4 h-4" />
                )}
                {isUploadingDoc ? "Uploading..." : "Add Optimized Resume"}
              </button>

              {recentDocUrl && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-700">
                  <Check className="w-4 h-4" />
                  <a href={recentDocUrl} target="_blank" rel="noreferrer" className="underline">
                    Document added — Open/Download
                  </a>
                </div>
              )}
              {docError && <p className="mt-2 text-sm text-red-600">{docError}</p>}
            </div>
          </div>
        );

      case "link":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Job Application Link</h4>
                <div className="flex space-x-2">
                  <button
                    onClick={() => copyToClipboard(jobDetails.joblink)}
                    className="flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </button>
                  <a
                    href={jobDetails.joblink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Open
                  </a>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
                <code className="text-sm text-gray-700 break-all font-mono">{jobDetails.joblink}</code>
              </div>
            </div>
          </div>
        );

      case "description":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h4>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                {jobDetails?.jobDescription ? (
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {jobDetails.jobDescription}
                  </div>
                ) : (
                  <p className="text-gray-500 italic text-sm">No job description available.</p>
                )}
              </div>
            </div>
          </div>
        );

      case "attachments":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-gray-900">Resume / Attachments</h4>
              </div>

              {/* ---- Image Attachments (IMAGES ONLY) ---- */}
              <div className="mb-6 rounded-lg border border-orange-200 p-4">
                <div className="flex items-center mb-3">
                  <UploadIcon className="w-4 h-4 text-orange-600 mr-2" />
                  <h4 className="text-sm font-semibold text-orange-700">
                    Upload Picture (PNG/JPG/WEBP)
                  </h4>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(e) => setImgFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                  />
                  <button
                    onClick={handleImgUpload}
                    disabled={!imgFile || isUploadingImg}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-600 text-white disabled:opacity-50"
                  >
                    {isUploadingImg ? (
                      <Loader2 className="animate-spin w-4 h-4" />
                    ) : (
                      <UploadIcon className="w-4 h-4" />
                    )}
                    {isUploadingImg ? "Uploading..." : "Upload"}
                  </button>
                </div>
                {imgError && <p className="mt-2 text-sm text-red-600">{imgError}</p>}
              </div>

              {/* Image Grid */}
              {attachments?.length ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {attachments.map((item, index) => (
                    <div
                      key={`${item}-${index}`}
                      className="relative group cursor-pointer bg-gray-50 rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-300 transition-all duration-200"
                      onClick={() => {
                        setSelectedImage(item);
                        setAttachmentsModalActiveStatus(true);
                      }}
                    >
                      <img
                        src={item}
                        alt={`Attachment ${index + 1}`}
                        className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <div className="bg-white rounded-full p-2 shadow-lg">
                            <ArrowRight className="w-5 h-5 text-gray-700" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-3">
                        <p className="text-white text-sm font-medium">Attachment {index + 1}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <User className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-gray-500 font-medium mb-1">No attachments yet</h3>
                  <p className="text-gray-400 text-sm">Upload pictures above to see them here.</p>
                </div>
              )}
            </div>
          </div>
        );

      case "timeline":
        return (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">📈 Application Timeline</h4>
              {jobDetails?.timeline?.length > 0 ? (
                <ol className="relative border-s border-gray-200">
                  {jobDetails.timeline.map((event: string, idx: number) => (
                    <li key={idx} className="mb-10 ms-6">
                      <span className="absolute flex items-center justify-center w-6 h-6 bg-purple-100 rounded-full -start-3 ring-8 ring-white">
                        <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 00-1.414 0L10 10.586 6.707 7.293A1 1 0 105.293 8.707l4 4a1 1 0 001.414 0l6-6a1 1 0 000-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                      <h3 className="flex items-center mb-1 text-md font-semibold text-purple-800">
                        {event}
                      </h3>
                      <p className="text-sm text-gray-500">Step {idx + 1}</p>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="text-gray-500 italic">No timeline available.</div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="relative w-full max-w-6xl h-[90vh] bg-white rounded-xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="w-full bg-gradient-to-r from-orange-600 to-red-500 text-white p-4 z-10">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="w-6 h-6 mr-3" />
              <div>
                <h1 className="text-xl font-bold">📄 FlashFire Jobs</h1>
                <p className="text-orange-100 text-sm">
                  {jobDetails.jobTitle} at {jobDetails.companyName}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowJobModal(false)}
              className="hover:bg-white hover:bg-opacity-20 p-2 rounded-full transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div className="w-56 bg-gray-50 border-r border-gray-200 py-6 px-3">
            <nav className="space-y-2">
              {[
                { id: "details", label: "Job Details", icon: FileText, color: "bg-blue-50 text-blue-700 border-blue-200" },
                { id: "link", label: "Job Link", icon: Link, color: "bg-green-50 text-green-700 border-green-200" },
                { id: "description", label: "Job Description", icon: Briefcase, color: "bg-purple-50 text-purple-700 border-purple-200" },
                { id: "attachments", label: "Resume / Attachments", icon: User, color: "bg-orange-50 text-orange-700 border-orange-200" },
                { id: "timeline", label: "Application Timeline", icon: TimerIcon, color: "bg-brown-800 text-orange-700 border-orange-200" },
              ].map((section: any) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-all duration-200 text-sm ${
                      isActive
                        ? `${section.color} border shadow-sm`
                        : "text-gray-700 hover:bg-white hover:shadow-sm border border-transparent"
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-2 ${isActive ? "" : "text-gray-500"}`} />
                    <span className="font-medium">{section.label}</span>
                    {isActive && <ArrowRight className="w-4 h-4 ml-auto" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">{renderContent()}</div>
        </div>

        {/* Image Lightbox */}
        {attachmentsModalActiveStatus && (
          <Suspense fallback={<LoadingScreen />}>
            <AttachmentsModal
              imageLink={selectedImage}
              setAttachmentsModalActiveStatus={setAttachmentsModalActiveStatus}
            />
          </Suspense>
        )}
      </div>
    </div>
  );
}
