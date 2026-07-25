import React, { useState, useEffect, useContext } from "react";
import { X, Copy, Briefcase, Building2, MapPin, FileText, Link2, ImagePlus, AlertCircle } from "lucide-react";
import { Job, JobStatus } from "../types";
import { UserContext } from "../state_management/UserContext";
import { useNavigate } from "react-router-dom";
import { useOperationsStore } from "../state_management/Operations";
import { toastUtils, toastMessages } from "../utils/toast";
import { sanitizeJobTitle, MAX_JOB_TITLE_LENGTH } from "../utils/jobTitle";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/** PUT /updatechanges  (action: "edit") */
async function persistAttachmentsToJobPUT({
    jobID,
    userDetails,
    token,
    urls,
    role,
    operationsName,
    operationsEmail,
}: {
    jobID: string;
    userDetails: any; // must include { email }
    token?: string | null;
    urls: string[];
    role?: string;
    operationsName?: string;
    operationsEmail?: string;
}) {
  if (role === "operations") {
        const res = await fetch(`${API_BASE_URL}/operations/jobs`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "edit",
                jobID,
                userDetails,
                attachmentUrls: urls, // backend uses $addToSet $each
                role: "operations",
                operationsName: operationsName || "operations",
                operationsEmail: operationsEmail || "operations@flashfirehq"
            }),
        });
        const json = await res.json().catch(() => ({}));
        if (!res.ok)
            throw new Error(json?.message || "Failed to update attachments");
        return json as { message: string; updatedJobs?: any[] };
    } else {
      const res = await fetch(`${API_BASE_URL}/updatechanges`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
              action: "edit",
              jobID,
              userDetails,
              token,
              attachmentUrls: urls, // backend uses $addToSet $each
          }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok)
          throw new Error(json?.message || "Failed to update attachments");
      return json as { message: string; updatedJobs?: any[] };
    }
    
}

/** Lightweight POST used to quickly detect 403 duplicate.
 *  Returns status + body without throwing on non-2xx.
 */
async function createJobPOSTQuick({
    jobDetails,
    userDetails,
    token,
    role,
    operationsName,
    operationsEmail,
}: {
    jobDetails: any;
    userDetails: any;
    token?: string | null;
    role?: string;
    operationsName?: string;
    operationsEmail?: string;
}) {
  if (role === "operations") {
        const res = await fetch(`${API_BASE_URL}/operations/jobs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                jobDetails, 
                userDetails, 
                role: "operations",
                operationsName,
                operationsEmail
            }),
        });
        const body = await res.json().catch(() => ({}));
        return { status: res.status, ok: res.ok, body };
    } else {
      const res = await fetch(`${API_BASE_URL}/addjob`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jobDetails, userDetails, token }),
      });
      const body = await res.json().catch(() => ({}));
      return { status: res.status, ok: res.ok, body };
    }
    
}

interface JobFormProps {
  job?: Job | null;
  onCancel: () => void;
  onSuccess?: () => void;
  setUserJobs: React.Dispatch<React.SetStateAction<any[]>>;
}

const JobForm: React.FC<JobFormProps> = ({ job, onCancel, onSuccess, setUserJobs }) => {
  const [formData, setFormData] = useState({
    jobTitle: "",
    companyName: "",
    jobLocation: "",
    jobDescription: "",
    joblink: "",
    dateAdded: new Date().toLocaleString('en-US'),
    // dateAdded: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),

    attachments: [] as string[],
    status: "saved" as JobStatus,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const context = useContext(UserContext);
  const userDetails = context?.userDetails;
  const token = context?.token;
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const role = useOperationsStore((state) => state.role);
  const operationsName = useOperationsStore((state) => state.name);
  const operationsEmail = useOperationsStore((state) => state.email);

  // preload form if editing
  useEffect(() => {
    if (job) {
      setFormData((prev) => ({
        ...prev,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
        jobLocation: job.jobLocation || "",
        jobDescription: job.jobDescription,
        joblink: job.joblink || "",
        dateApplied: job.dateApplied?.split("T")[0] || new Date().toISOString().split("T")[0],
        status: job.currentStatus,
      }));
      setIsEditMode(true);
    } else {
      setIsEditMode(false);
    }
  }, [job]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name } = e.target;
    const value = name === "jobTitle" ? sanitizeJobTitle(e.target.value) : e.target.value;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const newFiles: File[] = [];
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) newFiles.push(file);
      }
    }
    if (newFiles.length) {
      setImages((prev) => [...prev, ...newFiles]);
      setPreviews((prev) => [...prev, ...newFiles.map((f) => URL.createObjectURL(f))]);
    }
  };

  const handleRemoveImage = (idx: number) => {
    setPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
    setImages((prev) => prev.filter((_, i) => i !== idx));
  };

  const uploadImagesToCloudinary = async (): Promise<string[]> => {
    const urls: string[] = [];
    
    // Use the new unified upload service
    const { uploadAttachment } = await import('../utils/uploadService');

    for (const file of images) {
      try {
        const url = await uploadAttachment(file, 'flashfirejobs/attachments');
        if (url) urls.push(url);
      } catch (error) {
        console.error('Upload error:', error);
        // Continue with other files even if one fails
      }
    }
    return urls;
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditMode && (!formData.jobTitle.trim() || !formData.companyName.trim())) {
      setError("Job Title and Company Name are required.");
      toastUtils.error(toastMessages.validationError);
      return;
    }

    if (!isEditMode && !formData.jobDescription.trim()) {
      setError("Job Description (JD) is required.");
      toastUtils.error("No Job Description (JD). Please add JD before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    const loadingToast = toastUtils.loading(toastMessages.savingJob);

    // ---------- CREATE MODE ----------
    if (!isEditMode) {
      const optimisticId = Date.now().toString();
      // const nowIN = new Date().toLocaleString("en-US", { hour12: true, timeZone: "Asia/Kolkata" });
      const nowIN = new Date().toISOString();

      const optimisticJob = {
        jobID: optimisticId,
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        jobLocation: formData.jobLocation?.trim() || undefined,
        jobDescription: formData.jobDescription,
        joblink: formData.joblink,
        dateAdded: new Date().toLocaleString("en-US"),
        currentStatus: formData.status,
        userID: userDetails.email,
        attachments: [],
        timeline:
          role === "operations" || role === "operator" ? ["Added"] : ["Added by user"],
        createdByRole:
          role === "operations" || role === "operator" ? ("operations" as const) : ("user" as const),
        addedBy:
          role === "operations" || role === "operator"
            ? (operationsName || "").trim() || undefined
            : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: nowIN, // so it sorts to the top immediately
      };

      let closed = false;

      // 1) Arm a 1s gate: if no 403 by then, close form + optimistic update
      const closeTimer = setTimeout(() => {
        // optimistic UI add (top) then close
        setUserJobs((prev) => [optimisticJob, ...(prev || [])]);
        toastUtils.dismissToast(loadingToast);
        toastUtils.success(toastMessages.jobAdded);
        onSuccess?.();
        onCancel();
        setIsSubmitting(false);
        closed = true;
      }, 2500);

      try {
        if (role === "operations" && userDetails?.email) {
          const lockCheckResponse = await fetch(`${API_BASE_URL}/operations/check-lock-period`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientEmail: userDetails.email })
          });
          
          if (lockCheckResponse.ok) {
            const lockCheck = await lockCheckResponse.json();
            if (lockCheck.isLocked) {
              clearTimeout(closeTimer);
              toastUtils.dismissToast(loadingToast);
              toastUtils.error(lockCheck.message || "Client is in lock period");
              setIsSubmitting(false);
              setError(lockCheck.message || "Client is in lock period");
              return;
            }
          }
        }
        
        const jobDetails = {
          jobID: optimisticId,
          jobTitle: formData.jobTitle,
          companyName: formData.companyName,
          jobLocation: formData.jobLocation?.trim() || "",
          jobDescription: formData.jobDescription,
          joblink: formData.joblink,
          dateAdded: formData.dateAdded,
          currentStatus: formData.status,
          userID: userDetails.email,
        };

        const { status, ok, body } = await createJobPOSTQuick({
            jobDetails,
            userDetails,
            token,
            role,
            operationsName,
            operationsEmail,
        });

        if (status === 403) {
          clearTimeout(closeTimer);
          toastUtils.dismissToast(loadingToast);
          const errorMsg =
            body?.error === "BLOCKED_COMPANY" || body?.error === "BLOCKED_LOCATION"
              ? body?.message ||
                (body?.error === "BLOCKED_COMPANY"
                  ? "This company is blocked for this client."
                  : "This location is blocked for this client.")
              : body?.message || "Client is in lock period";
          toastUtils.error(errorMsg);
          setIsSubmitting(false);
          setError(errorMsg);
          return;
        }
        
        if (body?.message === "Job Already Exist !") {
          clearTimeout(closeTimer);
          toastUtils.dismissToast(loadingToast);
          toastUtils.error(body.message || "Job already exists!");
          setIsSubmitting(false);
          setError(body.message);
          return;
        }

        // If token invalid, try refresh first
        if (body?.message === "invalid token please login again" || body?.message === "Invalid token or expired") {
          console.log('Token invalid, attempting refresh...');
          
          // Try to refresh token
          if (context?.refreshToken) {
            const refreshSuccess = await context.refreshToken();
            if (refreshSuccess) {
              // Retry the request with new token
              console.log('Token refreshed, retrying job creation...');
              setTimeout(() => handleAddJob(e), 100);
              return;
            }
          }
          
          console.log('Token refresh failed, clearing storage and redirecting to login');
          toastUtils.dismissToast(loadingToast);
          toastUtils.error(toastMessages.unauthorizedError);
          localStorage.clear();
          navigate("/login");
          return;
        }

        // 3) If ok, sync with server response and proceed to upload images
        if (ok && body?.NewJobList) {
          // Update local state with server response
          setUserJobs(body.NewJobList);
          
          // Proceed to upload images and persist attachments in background
          (async () => {
            try {
              const uploadedUrls = await uploadImagesToCloudinary();
              if (uploadedUrls.length) {
                await persistAttachmentsToJobPUT({
                    jobID: optimisticId,
                    userDetails,
                    token,
                    urls: uploadedUrls,
                    role,
                    operationsName,
                    operationsEmail,
                });
              }
            } catch (err) {
              console.error("[background attachments persist] failed:", err);
            } finally {
              previews.forEach((u) => URL.revokeObjectURL(u));
            }
          })();
        } else {
          // If backend request failed, revert the optimistic update
          console.error("Backend request failed:", body);
          setUserJobs((prev) => prev.filter(job => job.jobID !== optimisticId));
          clearTimeout(closeTimer);
          toastUtils.dismissToast(loadingToast);
          toastUtils.error(toastMessages.jobError);
          setIsSubmitting(false);
          setError("Failed to save job. Please try again.");
        }
      } catch (err) {
        // Network or unexpected error: if the form hasn't closed yet, let the gate close it.
        console.error("[create quick] error:", err);
        if (!closed) {
          toastUtils.dismissToast(loadingToast);
          toastUtils.error(toastMessages.networkError);
        }
      }

      return; // end create mode
    }

    // ---------- EDIT MODE (unchanged: immediate close; background persist) ----------
    if (isEditMode && job) {
      // close immediately
      toastUtils.dismissToast(loadingToast);
      toastUtils.success(toastMessages.jobUpdated);
      onSuccess?.();
      onCancel();
      setIsSubmitting(false);

      // background upload & persist
      (async () => {
        try {
          const uploadedUrls = await uploadImagesToCloudinary();
          if (uploadedUrls.length) {
            const resp = await persistAttachmentsToJobPUT({
                jobID: job.jobID,
                userDetails,
                token,
                urls: uploadedUrls,
                role,
                operationsName,
                operationsEmail,
            });
            if (resp?.updatedJobs) setUserJobs(resp.updatedJobs);
          }
        } catch (err) {
          console.error("[background edit] failed:", err);
        } finally {
          previews.forEach((u) => URL.revokeObjectURL(u));
        }
      })();

      return;
    }
  };

  const fieldDisabledClass = isEditMode
    ? "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
    : "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 backdrop-blur-sm" onClick={onCancel} />

      {/* Modal Card */}
      <div className="relative bg-white shadow-2xl border border-gray-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 flex items-center justify-center bg-gradient-to-br from-orange-500 to-red-500 text-white flex-shrink-0 shadow-sm">
              <Briefcase className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {isEditMode ? "Edit Job Application" : "Add New Job Application"}
              </h3>
              <p className="text-xs text-gray-400">
                {isEditMode ? "Attach supporting resume images below" : "Track a new opportunity in your pipeline"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-5 flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAddJob} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                  Job Title *
                </label>
                <input
                  disabled={isEditMode}
                  readOnly={isEditMode}
                  name="jobTitle"
                  value={formData.jobTitle}
                  onChange={handleChange}
                  maxLength={MAX_JOB_TITLE_LENGTH}
                  required
                  placeholder="e.g. Senior Product Manager"
                  className={`w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow ${fieldDisabledClass}`}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {formData.jobTitle.length}/{MAX_JOB_TITLE_LENGTH} characters
                </p>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gray-400" />
                  Company Name *
                </label>
                <input
                  disabled={isEditMode}
                  readOnly={isEditMode}
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Acme Corp"
                  className={`w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow ${fieldDisabledClass}`}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                Location <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                disabled={isEditMode}
                readOnly={isEditMode}
                name="jobLocation"
                value={formData.jobLocation}
                onChange={handleChange}
                placeholder="e.g. Remote, USA or City, ST"
                className={`w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow ${fieldDisabledClass}`}
              />
              <p className="text-xs text-gray-400 mt-1">
                Used for client location exclusions. Leave blank if unknown.
              </p>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                Job Description{!isEditMode ? ' *' : ''}
              </label>
              <textarea
                disabled={isEditMode}
                readOnly={isEditMode}
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleChange}
                rows={4}
                placeholder="Paste the job description here..."
                className={`w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow resize-none ${fieldDisabledClass}`}
              />
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <ImagePlus className="w-3.5 h-3.5 text-gray-400" />
                Resume Screenshots <span className="text-gray-400 font-normal">(paste with Ctrl+V)</span>
              </label>
              <div
                onPaste={handlePaste}
                tabIndex={0}
                className="border-2 border-dashed border-gray-300 hover:border-orange-400 focus:border-orange-500 focus:outline-none p-4 min-h-[96px] transition-colors"
              >
                {previews.length ? (
                  <div className="flex flex-wrap gap-2">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative group w-20 h-20 flex-shrink-0">
                        <img src={src} alt="preview" className="w-20 h-20 object-cover border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center bg-gray-900 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-4 text-gray-400">
                    <Copy className="w-5 h-5 mb-1.5" />
                    <p className="text-sm">Click here, then paste one or more images</p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1.5">
                <Link2 className="w-3.5 h-3.5 text-gray-400" />
                Job Link
              </label>
              <input
                disabled={isEditMode}
                readOnly={isEditMode}
                name="joblink"
                value={formData.joblink}
                onChange={handleChange}
                placeholder="https://..."
                className={`w-full px-3 py-2.5 border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-shadow ${fieldDisabledClass}`}
              />
            </div>

            <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 text-sm font-medium bg-gradient-to-br from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-sm hover:shadow-md transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Saving..." : isEditMode ? "Update Job" : "Add Job"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default JobForm;
