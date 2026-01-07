import { XCircle, AlertCircle, Calendar } from 'lucide-react';

interface RemovalReasonDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  removalReason: string;
  removalDate: string;
  jobTitle: string;
  companyName: string;
}

export default function RemovalReasonDisplayModal({ 
  isOpen, 
  onClose,
  removalReason,
  removalDate,
  jobTitle,
  companyName
}: RemovalReasonDisplayModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="removal-reason-display-title"
    >
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 
                id="removal-reason-display-title"
                className="text-lg font-semibold text-gray-900"
              >
                Removal Reason
              </h2>
              <p className="text-sm text-gray-500">Why this job was removed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Job:</span> {jobTitle}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Company:</span> {companyName}
            </p>
          </div>

          {removalDate && (
            <div className="flex items-center gap-2 mb-4 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Removed on: {removalDate}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900">
              {removalReason}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

