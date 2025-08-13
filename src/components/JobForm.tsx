import React, { useState, useEffect, useContext } from "react";
import { X, Copy } from "lucide-react";
import { Job, JobStatus } from "../types";
import { UserContext } from "../state_management/UserContext";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/** PUT /api/jobs  (action: "edit") */
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
  const res = await fetch(`${API_BASE_URL}/api/jobs`, {
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

/** POST /api/jobs (create) */
async function createJobPOST({
  jobDetails,
  userDetails,
  token,
}: {
  jobDetails: any;
  userDetails: any;
  token?: string | null;
}) {
  const res = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobDetails, userDetails, token }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.message || "Failed to create job");
  return json as { message: string; NewJobList?: any[] };
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
    dateApplied: new Date().toISOString().split("T")[0],
    attachments: [] as string[],
    status: "saved" as JobStatus,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { userDetails, token } = useContext(UserContext);
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

    // ----- OPTIMISTIC UI FIRST -----
    if (!isEditMode) {
      const optimisticId = Date.now().toString();

      // use object-URL previews in UI immediately (they won't persist—only visual feedback)
      const optimisticJob = {
        jobID: optimisticId,
        jobTitle: formData.jobTitle,
        companyName: formData.companyName,
        jobDescription: formData.jobDescription,
        joblink: formData.joblink,
        dateApplied: formData.dateApplied,
        currentStatus: formData.status,
        userID: userDetails.email,
        attachments: [], // will fill after Cloudinary returns
        createdAt: new Date().toISOString(),
      };

      setUserJobs((prev) => [optimisticJob, ...(prev || [])]);

      // close the modal immediately for snappy UX
      onSuccess?.();
      onCancel();
      setIsSubmitting(false);

      // background: upload to Cloudinary, then POST to backend with SAME payload shape
      (async () => {
        try {
          const uploadedUrls = await uploadImagesToCloudinary();

          const jobDetails = {
            jobID: optimisticId, // same id so server list will replace the optimistic one
            jobTitle: formData.jobTitle,
            companyName: formData.companyName,
            jobDescription: formData.jobDescription,
            joblink: formData.joblink,
            dateApplied: formData.dateApplied,
            currentStatus: formData.status,
            userID: userDetails.email,
            attachments: uploadedUrls,
          };

          const data = await createJobPOST({ jobDetails, userDetails, token });

          if (data?.message === "invalid token please login again") {
            localStorage.clear();
            navigate("/login");
            return;
          }

          // sync full list from server (removes optimistic copy because jobID matches)
          setUserJobs(data?.NewJobList || []);
        } catch (err) {
          console.error("[background create] failed:", err);
          // optional: show a toast or mark the optimistic card as failed
        } finally {
          // clean up previews
          previews.forEach((u) => URL.revokeObjectURL(u));
        }
      })();

      return; // we’re done for create
    }

    // ----- EDIT MODE (optimistic close; then upload & persist attachments) -----
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
