import React, { useState, useEffect, useContext } from "react";
import { X, Copy } from "lucide-react";
import { Job, JobStatus } from "../types";
import { UserContext } from "../state_management/UserContext";
import { useNavigate } from "react-router-dom";
import { useOperationsStore } from "../state_management/Operations";
import { toastUtils, toastMessages } from "../utils/toast";
import { useCreateJob, useUpdateJob } from "../hooks/useJobs";
import { useOperationsCreateJob, useOperationsUpdateJob } from "../hooks/useOperations";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/** PUT /updatechanges  (action: "edit") */
async function persistAttachmentsToJobPUT({
    jobID,
    userDetails,
    token,
    urls,
    role,
}: {
    jobID: string;
    userDetails: any; // must include { email }
    token?: string | null;
    urls: string[];
    role?: string;
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
}: {
    jobDetails: any;
    userDetails: any;
    token?: string | null;
    role?: string;
}) {
  if (role === "operations") {
        const res = await fetch(`${API_BASE_URL}/operations/jobs`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ jobDetails, userDetails }),
        });
        const body = await res.json().catch(() => ({}));
        return { status: res.status, ok: res.ok, body };
    } else {
      const res = await fetch(`${API_BASE_URL}/operations/jobs`, {
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
    jobDescription: "",
    joblink: "",
    dateAdded: new Date().toLocaleString('en-US'),
    attachments: [] as string[],
    status: "saved" as JobStatus,
  });

  const [error, setError] = useState<string | null>(null);
  const context = useContext(UserContext);
  const userDetails = context?.userDetails;
  const token = context?.token;
  const navigate = useNavigate();
  const [isEditMode, setIsEditMode] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const role = useOperationsStore((state) => state.role);
  
  // React Query mutations
  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const operationsCreateJobMutation = useOperationsCreateJob();
  const operationsUpdateJobMutation = useOperationsUpdateJob();

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
      toastUtils.error(toastMessages.validationError);
      return;
    }

    setError(null);
    const loadingToast = toastUtils.loading(toastMessages.savingJob);

    // ---------- CREATE MODE ----------
    if (!isEditMode) {
      try {
        const jobDetails = {
          jobTitle: formData.jobTitle,
          companyName: formData.companyName,
          jobDescription: formData.jobDescription,
          joblink: formData.joblink,
          dateAdded: formData.dateAdded,
          currentStatus: formData.status,
          userID: userDetails.email,
        };

        let result;
        if (role === "operations") {
          // Use operations API for operations users
          result = await operationsCreateJobMutation.mutateAsync({ 
            jobDetails, 
            userDetails 
          });
        } else {
          // Use regular API for normal users
          result = await createJobMutation.mutateAsync({ 
            token: token!, 
            jobData: jobDetails,
            userDetails: { email: userDetails.email }
          });
        }

        toastUtils.dismissToast(loadingToast);
        toastUtils.success(toastMessages.jobAdded);
        onSuccess?.();
        onCancel();

        // Upload images in background
        (async () => {
          try {
            const uploadedUrls = await uploadImagesToCloudinary();
            if (uploadedUrls.length && result?.jobID) {
              await persistAttachmentsToJobPUT({
                jobID: result.jobID,
                userDetails,
                token,
                urls: uploadedUrls,
                role,
              });
            }
          } catch (err) {
            console.error("[background attachments persist] failed:", err);
          } finally {
            previews.forEach((u) => URL.revokeObjectURL(u));
          }
        })();

      } catch (err: any) {
        console.error("[create job] error:", err);
        toastUtils.dismissToast(loadingToast);
        
        if (err?.message === "Job Already Exist !") {
          toastUtils.error("Job already exists!");
          setError("Job already exists!");
        } else if (err?.status === 401 || err?.status === 403) {
          toastUtils.error(toastMessages.unauthorizedError);
          localStorage.clear();
          navigate("/login");
        } else {
          toastUtils.error(toastMessages.networkError);
          setError("Failed to save job. Please try again.");
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
            disabled={
              createJobMutation.isPending || 
              updateJobMutation.isPending ||
              operationsCreateJobMutation.isPending ||
              operationsUpdateJobMutation.isPending
            }
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
          >
            {(createJobMutation.isPending || 
              updateJobMutation.isPending ||
              operationsCreateJobMutation.isPending ||
              operationsUpdateJobMutation.isPending) ? "Saving..." : isEditMode ? "Update Job" : "Add Job"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobForm;
