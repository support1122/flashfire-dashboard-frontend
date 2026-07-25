import { useState, useEffect, useRef } from 'react';
import { XCircle, AlertCircle, Sparkles } from 'lucide-react';

interface RemovalReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  jobTitle: string;
  companyName: string;
}

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
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-xl border border-gray-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2
                id="removal-reason-title"
                className="text-lg font-semibold text-gray-900"
              >
                Why are you removing this job?
              </h2>
              <p className="text-sm text-gray-500">
                Tell us what didn't fit, and we'll stop sending jobs like it.
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-5">
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-900">{jobTitle}</p>
              <p className="text-sm text-gray-500">{companyName}</p>
            </div>

            {/* Quick reasons */}
            <p className="block text-sm font-medium text-gray-700 mb-2">
              What didn't work? <span className="font-normal text-gray-500">(pick any that apply)</span>
            </p>
            <div className="flex flex-wrap gap-2 mb-4" role="group" aria-label="Common removal reasons">
              {QUICK_REASONS.map((reason) => {
                const selected = selectedReasons.includes(reason);
                return (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => toggleReason(reason)}
                    disabled={isSubmitting}
                    aria-pressed={selected}
                    className={`px-3 py-1.5 rounded-full text-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-300 ${
                      selected
                        ? 'bg-orange-500 border-orange-500 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-orange-400 hover:text-orange-600'
                    }`}
                  >
                    {reason}
                  </button>
                );
              })}
            </div>

            <label
              htmlFor="removal-reason-textarea"
              className="block text-sm font-medium text-gray-700 mb-2"
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
              rows={3}
              maxLength={REASON_MAX_LENGTH}
              disabled={isSubmitting}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 disabled:bg-gray-100 disabled:cursor-not-allowed resize-none transition-all"
              aria-required={selectedReasons.length === 0}
              aria-describedby="removal-reason-description"
            />
            <p className="mt-1 text-right text-xs text-gray-400">
              {details.length}/{REASON_MAX_LENGTH}
            </p>

            {/* AI feedback callout */}
            <div
              id="removal-reason-description"
              className="mt-2 flex items-start gap-2 bg-violet-50 border border-violet-200 rounded-lg px-3 py-2.5"
            >
              <Sparkles className="w-4 h-4 text-violet-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-violet-800">
                Your feedback updates your AI matching profile right away, so future
                job picks avoid this pattern. It's also shared with your ops team.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
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
              className="flex-1 bg-orange-500 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-300"
            >
              {isSubmitting ? 'Removing...' : 'Remove job'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
