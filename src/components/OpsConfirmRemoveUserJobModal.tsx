import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

interface OpsConfirmRemoveUserJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  jobTitle: string;
  companyName: string;
}

export default function OpsConfirmRemoveUserJobModal({
  isOpen,
  onClose,
  onConfirm,
  jobTitle,
  companyName,
}: OpsConfirmRemoveUserJobModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ops-remove-user-job-title"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="flex gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-700" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id="ops-remove-user-job-title"
              className="text-lg font-semibold text-gray-900"
            >
              Remove client-added job?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              This job was added by the user. Are you sure you want to move it to{" "}
              <span className="font-medium">Removed</span>? This action is meant for jobs the
              client created themselves.
            </p>
            <p className="mt-2 truncate text-sm text-gray-500" title={`${jobTitle} — ${companyName}`}>
              <span className="font-medium text-gray-700">{jobTitle}</span>
              <span className="text-gray-400"> · </span>
              {companyName}
            </p>
          </div>
        </div>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
          >
            Yes, continue
          </button>
        </div>
      </div>
    </div>
  );
}
