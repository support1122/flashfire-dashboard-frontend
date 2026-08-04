import { useState, useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';

// Quick-pick reasons. Wording matters: each maps to a durable preference
// pattern the AI summary builder can route (role/seniority/location/salary/
// visa/company), so keep these aligned with the backend's removal-feedback
// routing rules if you edit them.
const QUICK_REASONS = [
  'Not my target role',
  'Wrong seniority level',
  'Location doesn\'t work for me',
  'Salary is below my range',
  'No visa sponsorship',
  'Company isn\'t a fit',
  'Already applied on my own',
  'Duplicate job',
];

const companyInitials = (name: string): string => {
  const words = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const sanitizeCompanyDomain = (name: string): string => {
  if (!name) return "example.com";
  let domain = name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9.-]/g, "");
  if (!domain.includes(".")) domain += ".com";
  return domain;
};

const REASON_MAX_LENGTH = 500;

interface RemovalReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  jobTitle: string;
  companyName: string;
}

export default function RemovalReasonModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  jobTitle,
  companyName 
}: RemovalReasonModalProps) {
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const composedReason = [selectedReasons.join('; '), details.trim()]
    .filter(Boolean)
    .join('. ');

  useEffect(() => {
    if (isOpen) {
      setSelectedReasons([]);
      setDetails('');
      setIsSubmitting(false);
      setLogoLoaded(false);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting, onClose]);

  const toggleReason = (reason: string) => {
    if (isSubmitting) return;
    setSelectedReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSubmit = async () => {
    if (!composedReason) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(composedReason.slice(0, REASON_MAX_LENGTH));
    } catch (error) {
      console.error('Error submitting removal reason:', error);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      setSelectedReasons([]);
      setDetails('');
      onClose();
    }
  };

  if (!isOpen) return null;

  const companyLabel = companyName?.trim() || '?';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="removal-reason-title"
      aria-describedby="removal-reason-description"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-lg border-[3px] border-gray-500 text-gray-800 hover:bg-gray-100 hover:text-gray-900 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" strokeWidth={3} />
        </button>

        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 pr-16 border-b border-gray-100">
          <h2
            id="removal-reason-title"
            className="flex items-center gap-2 text-2xl font-bold text-gray-900"
          >
            Remove Job Card
            <Trash2 className="w-5 h-5 text-gray-500" />
          </h2>
          <p className="text-base text-gray-700 mt-0.5">Please provide a reason</p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="border border-gray-400 rounded-2xl p-5 mb-6">
            <p className="text-lg font-bold text-gray-900 mb-4">{jobTitle}</p>
            <div className="flex items-center gap-3">
              <div className="relative w-11 h-11 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0 overflow-hidden">
                <span className={logoLoaded ? 'invisible' : ''}>{companyInitials(companyLabel)}</span>
                <img
                  src={`https://www.google.com/s2/favicons?domain=${sanitizeCompanyDomain(companyLabel)}&sz=64`}
                  alt=""
                  className="absolute inset-0 w-full h-full object-contain p-2 bg-white"
                  style={{ display: logoLoaded ? 'block' : 'none' }}
                  onError={() => setLogoLoaded(false)}
                  onLoad={(e) => {
                    const img = e.currentTarget;
                    setLogoLoaded(!(img.naturalHeight === 16 && img.naturalWidth === 16));
                  }}
                />
              </div>
              <span className="text-base text-gray-700 font-medium truncate">{companyName}</span>
            </div>
          </div>

          <p className="block text-base font-semibold text-gray-800 mb-3">
            What didn't work? <span className="font-normal text-gray-400">(pick any that apply)</span>
          </p>
          <div className="grid grid-cols-2 gap-3 mb-6" role="group" aria-label="Common removal reasons">
            {QUICK_REASONS.map((quickReason) => {
              const selected = selectedReasons.includes(quickReason);
              return (
                <button
                  key={quickReason}
                  type="button"
                  onClick={() => toggleReason(quickReason)}
                  disabled={isSubmitting}
                  aria-pressed={selected}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left border transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                    selected
                      ? 'bg-orange-50 border-orange-400 text-orange-800 font-medium'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                    selected ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                  }`}>
                    {selected && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{quickReason}</span>
                </button>
              );
            })}
          </div>

          <label
            htmlFor="removal-reason-textarea"
            className="block text-base font-medium text-gray-600 mb-2.5"
          >
            Reason for Removal
          </label>
          <textarea
            id="removal-reason-textarea"
            ref={textareaRef}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Enter the reason for moving this job card to removed."
            rows={4}
            maxLength={REASON_MAX_LENGTH}
            disabled={isSubmitting}
            className="w-full px-5 py-4 bg-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed resize-none transition-all placeholder:text-gray-500"
            aria-required="true"
            aria-describedby="removal-reason-description"
          />

          <div
            id="removal-reason-description"
            className="mt-5 flex items-center justify-center bg-white border border-orange-200 rounded-xl px-4 py-3"
          >
            <p className="text-sm text-gray-500 text-center">
              This information will be sent to the operations teams.
            </p>
          </div>
        </div>

        {/* Action Buttons — pinned so they stay reachable while the body scrolls */}
        <div className="flex-shrink-0 flex gap-4 px-6 py-5 border-t border-gray-100 bg-white">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 bg-gray-200 text-gray-600 px-4 py-4 rounded-lg font-semibold border border-gray-300 hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!composedReason || isSubmitting}
            className="flex-1 bg-orange-500 text-white px-4 py-4 rounded-lg font-semibold hover:bg-orange-600 transition-colors disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {isSubmitting ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );
}

