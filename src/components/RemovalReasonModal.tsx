import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Sparkles } from 'lucide-react';

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
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-7 pt-6 pb-5 pr-16 border-b border-gray-100">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
          <h2
            id="removal-reason-title"
            className="flex items-center gap-2.5 text-[22px] leading-tight font-bold text-gray-900"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-orange-50">
              <Trash2 className="w-4 h-4 text-orange-600" />
            </span>
            Remove Job Card
          </h2>
          <p className="text-sm text-gray-500 mt-1.5">
            Tell us what didn't fit, and we'll stop sending jobs like it.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 pt-7 pb-5">
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">Removing</p>
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
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900 truncate">{jobTitle}</p>
                <p className="text-sm text-gray-500 truncate">{companyName}</p>
              </div>
            </div>
          </div>

          {/* Quick reasons */}
          <p className="block text-sm font-semibold text-gray-700 mb-2.5">
            What didn't work? <span className="font-normal text-gray-400">(pick any that apply)</span>
          </p>
          <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Common removal reasons">
            {QUICK_REASONS.map((quickReason) => {
              const selected = selectedReasons.includes(quickReason);
              return (
                <button
                  key={quickReason}
                  type="button"
                  onClick={() => toggleReason(quickReason)}
                  disabled={isSubmitting}
                  aria-pressed={selected}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                    selected
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600'
                  }`}
                >
                  {quickReason}
                </button>
              );
            })}
          </div>

          <label
            htmlFor="removal-reason-textarea"
            className="block text-sm font-semibold text-gray-700 mb-2.5"
          >
            Anything else we should know?
            {selectedReasons.length === 0 && <span className="text-red-500"> *</span>}
          </label>
          <textarea
            id="removal-reason-textarea"
            ref={textareaRef}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="e.g. This is a QA role and I'm only looking for data engineering positions"
            rows={4}
            maxLength={REASON_MAX_LENGTH}
            disabled={isSubmitting}
            className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:cursor-not-allowed resize-none transition-all placeholder:text-gray-400"
            aria-required={selectedReasons.length === 0}
            aria-describedby="removal-reason-description"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {details.length}/{REASON_MAX_LENGTH}
          </p>
          <div
            id="removal-reason-description"
            className="mt-5 flex items-start gap-2 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3"
          >
            <Sparkles className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-orange-900">
              Your feedback updates your AI matching profile right away, so future
              job picks avoid this pattern. It's also shared with your ops team.
            </p>
          </div>
        </div>

        {/* Action Buttons — pinned so they stay reachable while the body scrolls */}
        <div className="flex-shrink-0 flex gap-3 px-7 py-5 border-t border-gray-100">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 bg-white text-gray-700 border border-gray-300 px-4 py-3.5 rounded-2xl font-semibold hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Keep this job
          </button>
          <button
            onClick={handleSubmit}
            disabled={!composedReason || isSubmitting}
            className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-3.5 rounded-2xl font-semibold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {isSubmitting ? 'Removing...' : 'Remove job'}
          </button>
        </div>
      </div>
    </div>
  );
}

