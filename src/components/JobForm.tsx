import React, { useState, useEffect, useContext } from "react";
import { X, Copy } from "lucide-react";
import { Job, JobStatus } from "../types";
import { UserContext } from "../state_management/UserContext";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/** PUT /updatechanges  (action: "edit") */
async function persistAttachmentsToJobPUT({
  jobID,
  userDetails,
  token,
  urls,
}: {
  jobID: string;
  userDetails: any; // must include { email }
  token?: string | null;
  urls: string[];
}) {
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
  if (!res.ok) throw new Error(json?.message || "Failed to update attachments");
  return json as { message: string; updatedJobs?: any[] };
}

/** Lightweight POST used to quickly detect 403 duplicate.
 *  Returns status + body without throwing on non-2xx.
 */
async function createJobPOSTQuick({
  jobDetails,
  userDetails,
  token,
}: {
  jobDetails: any;
  userDetails: any;
  token?: string | null;
}) {
  const res = await fetch(`${API_BASE_URL}/addjob`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDetails, userDetails, token }),
  });
  const body = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, body };
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
    jobDescription: "",
    joblink: "",
    dateAdded: new Date().toLocaleString('en-US'),
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

  // preload form if editing
  useEffect(() => {
    if (job) {
      setFormData((prev) => ({
        ...prev,
        jobTitle: job.jobTitle,
        companyName: job.companyName,
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
    const { name, value } = e.target;
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

  const uploadImagesToCloudinary = async (): Promise<string[]> => {
    const urls: string[] = [];
    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const UPLOAD_PRESET =
      import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
      import.meta.env.VITE_CLOUDINARY_CLOUD_PRESET;

    if (!CLOUD_NAME || !UPLOAD_PRESET) {
      console.error("Missing Cloudinary envs");
      return urls;
    }

    for (const file of images) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", "flashfirejobs/attachments");

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
        { method: "POST", body: fd }
      );
      if (!res.ok) continue;

      const data = await res.json();
      if (data.secure_url) urls.push(data.secure_url);
    }
    return urls;
  };

  const handleAddJob = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isEditMode && (!formData.jobTitle.trim() || !formData.companyName.trim())) {
      setError("Job Title and Company Name are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // ---------- CREATE MODE ----------
    if (!isEditMode) {
      const optimisticId = Date.now().toString();
      // const nowIN = new Date().toLocaleString("en-US", { hour12: true, timeZone: "Asia/Kolkata" });
      const nowIN = new Date().toISOString();

      const optimisticJob = {
        jobID: optimisticId,
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        jobDescription: formData.jobDescription,
        joblink: formData.joblink,
        dateAdded: new Date().toLocaleString("en-US"),
        currentStatus: formData.status,
        userID: userDetails.email,
        attachments: [],
        createdAt: new Date().toISOString(),
        updatedAt: nowIN, // so it sorts to the top immediately
      };

      let closed = false;

      // 1) Arm a 1s gate: if no 403 by then, close form + optimistic update
      const closeTimer = setTimeout(() => {
        // optimistic UI add (top) then close
        setUserJobs((prev) => [optimisticJob, ...(prev || [])]);
        onSuccess?.();
        onCancel();
        setIsSubmitting(false);
        closed = true;
      }, 2500);

      try {
        // 2) Immediately POST minimal payload (no attachments) to quickly detect duplicate
        const jobDetails = {
          jobID: optimisticId,
          jobTitle: formData.jobTitle,
          companyName: formData.companyName,
          jobDescription: formData.jobDescription,
          joblink: formData.joblink,
          dateAdded: formData.dateAdded,
          currentStatus: formData.status,
          userID: userDetails.email,
          // attachments intentionally omitted for speed
        };

        const { status, ok, body } = await createJobPOSTQuick({ jobDetails, userDetails, token });

        // If duplicate within 1s -> keep form open and show the message
        if (status === 403 || body?.message === "Job Already Exist !") {
          clearTimeout(closeTimer);
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
          setIsSubmitting(false);
          setError("Failed to save job. Please try again.");
        }
      } catch (err) {
        // Network or unexpected error: if the form hasn't closed yet, let the gate close it.
        console.error("[create quick] error:", err);
      }

      return; // end create mode
    }

    // ---------- EDIT MODE (unchanged: immediate close; background persist) ----------
    if (isEditMode && job) {
      // close immediately
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          {isEditMode ? "Edit Job Application" : "Add New Job Application"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}

      <form onSubmit={handleAddJob} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium">Job Title *</label>
            <input
              disabled={isEditMode}
              readOnly={isEditMode}
              name="jobTitle"
              value={formData.jobTitle}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Company Name *</label>
            <input
              disabled={isEditMode}
              readOnly={isEditMode}
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Job Description</label>
          <textarea
            disabled={isEditMode}
            readOnly={isEditMode}
            name="jobDescription"
            value={formData.jobDescription}
            onChange={handleChange}
            rows={4}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Paste Resume Images (Ctrl+V)</label>
          <div
            onPaste={handlePaste}
            className="border-2 border-dotted border-red-600 p-4 min-h-[80px] rounded-lg"
          >
            {previews.length ? (
              <div className="flex flex-wrap gap-2">
                {previews.map((src, idx) => (
                  <img key={idx} src={src} alt="preview" className="w-20 h-20 object-cover" />
                ))}
              </div>
            ) : (
              <p className="text-gray-500 flex items-center">
                <Copy className="w-4 h-4 mr-1" /> Paste one or more images here
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium">Job Link</label>
          <input
            disabled={isEditMode}
            readOnly={isEditMode}
            name="joblink"
            value={formData.joblink}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg"
          />
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            {isSubmitting ? "Saving..." : isEditMode ? "Update Job" : "Add Job"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
