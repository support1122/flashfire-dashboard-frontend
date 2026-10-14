import { XCircle, AlertCircle, Calendar, Lock } from 'lucide-react';

interface RemovalReasonDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  removalReason: string;
  removalDate: string;
  removedBy?: string;
  jobTitle: string;
  companyName: string;
  /**
   * The operator's written reason. Only ever passed in the operator view,
   * which fetches it from /operations/job-removal-note; a client's view has
   * no way to obtain it.
   */
  operatorNote?: { reason: string; by: string; at: string | null } | null;
}

const formatNoteDate = (at: string | null): string => {
  if (!at) return '';
  const d = new Date(at);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' });
};

export default function RemovalReasonDisplayModal({ 
  isOpen, 
  onClose,
  removalReason,
  removalDate,
  removedBy,
  jobTitle,
  companyName,
  operatorNote = null,
}: RemovalReasonDisplayModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="removal-reason-display-title"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-gray-200">
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

        <div className="flex-1 overflow-y-auto p-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600 mb-2">
              <span className="font-medium">Job:</span> {jobTitle}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Company:</span> {companyName}
            </p>
          </div>

          {operatorNote?.reason && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-orange-600" aria-hidden="true" />
                <span className="text-sm font-medium text-gray-700">Operator note (internal)</span>
              </div>
              <div className="w-full px-4 py-3 border border-orange-200 rounded-lg bg-orange-50 text-gray-900 whitespace-pre-wrap break-words">
                {operatorNote.reason}
              </div>
              {(operatorNote.by || operatorNote.at) && (
                <p className="mt-2 text-xs text-gray-600">
                  {[operatorNote.by && `By ${operatorNote.by}`, formatNoteDate(operatorNote.at)].filter(Boolean).join(' · ')}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">Only operators see this note. The client never does.</p>
            </div>
          )}

          {removalReason && (
          <>
          <div className="mb-4 space-y-2">
            {removedBy && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Removed by:</span> {removedBy}
              </div>
            )}
            {removalDate && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Removed on: {removalDate}</span>
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {operatorNote?.reason ? "Client's reason" : 'Reason'}
            </label>
            <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 whitespace-pre-wrap break-words">
              {removalReason}
            </div>
          </div>
          </>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end px-6 py-4 border-t border-gray-200 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

