import { useState, useEffect, useRef } from 'react';
import { X, Trash2, Sparkles } from 'lucide-react';

const companyBadgeColor = (name: string): string => {
  const colors = [
    'bg-blue-900', 'bg-orange-600', 'bg-emerald-700',
    'bg-purple-700', 'bg-rose-700', 'bg-slate-700',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const composedReason = [selectedReasons.join('; '), details.trim()]
    .filter(Boolean)
    .join('. ');

  useEffect(() => {
    if (isOpen) {
      setSelectedReasons([]);
      setDetails('');
      setIsSubmitting(false);
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
        {/* Close button */}
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white border border-gray-300 text-gray-500 hover:text-gray-700 hover:border-gray-400 shadow-sm flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex-shrink-0 px-7 pt-7 pb-4 pr-20 border-b border-gray-100">
          <h2
            id="removal-reason-title"
            className="flex items-center gap-2 text-[26px] leading-tight font-semibold text-gray-600"
          >
            Remove Job Card
            <Trash2 className="w-5 h-5 text-gray-500" />
          </h2>
          <p className="text-base text-gray-800 mt-1">
            Tell us what didn't fit, and we'll stop sending jobs like it.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 pt-7 pb-5">
          <div className="border border-gray-300 rounded-2xl p-5 mb-7">
            <p className="text-xl font-bold text-gray-900 mb-6">{jobTitle}</p>
            <div className="flex items-center gap-4">
              <div className={`w-14 h-14 rounded-lg ${companyBadgeColor(companyName)} text-white flex items-center justify-center text-[10px] font-semibold flex-shrink-0 px-1.5 text-center leading-tight break-words`}>
                {companyLabel}
              </div>
              <span className="text-lg text-gray-600 font-medium">{companyName}</span>
            </div>
          </div>

          {/* Quick reasons */}
          <p className="block text-lg font-medium text-gray-600 mb-3">
            What didn't work? <span className="text-base font-normal text-gray-500">(pick any that apply)</span>
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
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-300 ${
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
            className="block text-lg font-medium text-gray-600 mb-3"
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
            className="w-full px-5 py-4 bg-gray-200 rounded-2xl focus:ring-2 focus:ring-orange-500 disabled:cursor-not-allowed resize-none transition-all placeholder:text-gray-500"
            aria-required={selectedReasons.length === 0}
            aria-describedby="removal-reason-description"
          />
          <p className="mt-1 text-right text-xs text-gray-400">
            {details.length}/{REASON_MAX_LENGTH}
          </p>
          <div
            id="removal-reason-description"
            className="mt-5 flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-xl px-4 py-3"
          >
            <Sparkles className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-violet-800">
              Your feedback updates your AI matching profile right away, so future
              job picks avoid this pattern. It's also shared with your ops team.
            </p>
          </div>
        </div>

        {/* Action Buttons — pinned so they stay reachable while the body scrolls */}
        <div className="flex-shrink-0 flex gap-4 px-7 py-5 border-t border-gray-100 bg-white">
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="flex-1 bg-gray-200 text-gray-500 px-4 py-4 rounded-2xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Keep this job
          </button>
          <button
            onClick={handleSubmit}
            disabled={!composedReason || isSubmitting}
            className="flex-1 bg-orange-600 text-white px-4 py-4 rounded-2xl font-semibold hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-300"
          >
            {isSubmitting ? 'Removing...' : 'Remove job'}
          </button>
        </div>
      </div>
    </div>
  );
}

